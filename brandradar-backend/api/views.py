from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Count, Q, Avg
from django.utils import timezone
from datetime import timedelta
from .models import Brand, Mention, Alert
from .serializers import BrandSerializer, MentionSerializer, AlertSerializer

class BrandListCreateView(generics.ListCreateAPIView):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer

class BrandDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer

class MentionListView(generics.ListAPIView):
    serializer_class = MentionSerializer
    
    def get_queryset(self):
        queryset = Mention.objects.select_related('brand').all()
        brand_id = self.request.query_params.get('brand_id')
        source = self.request.query_params.get('source')
        sentiment = self.request.query_params.get('sentiment')
        days = self.request.query_params.get('days', 7)
        
        # Filter by date range
        date_from = timezone.now() - timedelta(days=int(days))
        queryset = queryset.filter(timestamp__gte=date_from)
        
        if brand_id:
            queryset = queryset.filter(brand_id=brand_id)
        if source:
            queryset = queryset.filter(source=source)
        if sentiment:
            queryset = queryset.filter(sentiment=sentiment)
            
        return queryset.order_by('-timestamp')[:100]

class AlertListView(generics.ListAPIView):
    serializer_class = AlertSerializer
    
    def get_queryset(self):
        return Alert.objects.filter(is_active=True).order_by('-created_at')[:20]

@api_view(['POST'])
def dismiss_alert(request, alert_id):
    """Dismiss an alert"""
    try:
        alert = Alert.objects.get(id=alert_id)
        alert.is_active = False
        alert.save()
        return Response({'status': 'dismissed'})
    except Alert.DoesNotExist:
        return Response({'error': 'Alert not found'}, status=404)

@api_view(['GET'])
def sentiment_stats(request):
    """Get sentiment statistics"""
    brand_id = request.query_params.get('brand_id')
    days = int(request.query_params.get('days', 7))
    
    queryset = Mention.objects.all()
    if brand_id:
        queryset = queryset.filter(brand_id=brand_id)
    
    # Get mentions from specified days
    date_from = timezone.now() - timedelta(days=days)
    queryset = queryset.filter(timestamp__gte=date_from)
    
    stats = queryset.aggregate(
        positive=Count('id', filter=Q(sentiment='positive')),
        neutral=Count('id', filter=Q(sentiment='neutral')),
        negative=Count('id', filter=Q(sentiment='negative')),
        avg_sentiment=Avg('sentiment_score')
    )
    
    # Add percentage calculations
    total = stats['positive'] + stats['neutral'] + stats['negative']
    if total > 0:
        stats['positive_pct'] = round((stats['positive'] / total) * 100, 1)
        stats['neutral_pct'] = round((stats['neutral'] / total) * 100, 1)
        stats['negative_pct'] = round((stats['negative'] / total) * 100, 1)
    else:
        stats['positive_pct'] = stats['neutral_pct'] = stats['negative_pct'] = 0
    
    return Response(stats)

@api_view(['GET'])
def topic_stats(request):
    """Get topic analysis"""
    brand_id = request.query_params.get('brand_id')
    days = int(request.query_params.get('days', 7))
    
    queryset = Mention.objects.all()
    if brand_id:
        queryset = queryset.filter(brand_id=brand_id)
    
    # Get top topics from specified days
    date_from = timezone.now() - timedelta(days=days)
    topics = queryset.filter(
        timestamp__gte=date_from,
        topic__isnull=False
    ).exclude(topic='').values('topic').annotate(
        count=Count('id'),
        avg_sentiment=Avg('sentiment_score')
    ).order_by('-count')[:10]
    
    return Response(list(topics))

@api_view(['GET'])
def source_stats(request):
    """Get statistics by source"""
    brand_id = request.query_params.get('brand_id')
    days = int(request.query_params.get('days', 7))
    
    queryset = Mention.objects.all()
    if brand_id:
        queryset = queryset.filter(brand_id=brand_id)
    
    date_from = timezone.now() - timedelta(days=days)
    sources = queryset.filter(timestamp__gte=date_from).values('source').annotate(
        count=Count('id'),
        positive=Count('id', filter=Q(sentiment='positive')),
        negative=Count('id', filter=Q(sentiment='negative')),
        avg_sentiment=Avg('sentiment_score')
    ).order_by('-count')
    
    return Response(list(sources))

@api_view(['GET'])
def timeline_stats(request):
    """Get mention timeline for charts"""
    brand_id = request.query_params.get('brand_id')
    days = int(request.query_params.get('days', 7))
    
    queryset = Mention.objects.all()
    if brand_id:
        queryset = queryset.filter(brand_id=brand_id)
    
    # Get daily mention counts
    from django.db.models import TruncDate
    date_from = timezone.now() - timedelta(days=days)
    
    timeline = queryset.filter(timestamp__gte=date_from).extra(
        select={'day': 'date(timestamp)'}
    ).values('day').annotate(
        count=Count('id'),
        positive=Count('id', filter=Q(sentiment='positive')),
        negative=Count('id', filter=Q(sentiment='negative')),
        neutral=Count('id', filter=Q(sentiment='neutral'))
    ).order_by('day')
    
    return Response(list(timeline))

@api_view(['POST'])
def trigger_monitoring(request):
    """Manually trigger monitoring for all brands"""
    from monitoring.monitor_service import monitor_brands
    
    try:
        result = monitor_brands()
        return Response({'status': 'success', 'message': result})
    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=500)

@api_view(['GET'])
def test_api(request):
    """Test API endpoint"""
    from django.db import connection
    
    brands_count = Brand.objects.count()
    mentions_count = Mention.objects.count()
    alerts_count = Alert.objects.count()
    
    return Response({
        'status': 'API Working',
        'database': 'Connected',
        'counts': {
            'brands': brands_count,
            'mentions': mentions_count,
            'alerts': alerts_count
        },
        'sample_brand': Brand.objects.first().name if brands_count > 0 else None,
        'sample_mention': Mention.objects.first().text[:50] if mentions_count > 0 else None
    })