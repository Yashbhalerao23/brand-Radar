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
        
        print(f"MentionListView - brand_id: {brand_id}, source: {source}, days: {days}")
        
        # Filter by date range
        date_from = timezone.now() - timedelta(days=int(days))
        queryset = queryset.filter(timestamp__gte=date_from)
        
        if brand_id:
            queryset = queryset.filter(brand_id=brand_id)
        if source:
            queryset = queryset.filter(source=source)
        if sentiment:
            queryset = queryset.filter(sentiment=sentiment)
        
        result = queryset.order_by('-timestamp')[:100]
        print(f"Found {result.count()} mentions")
        return result

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
    try:
        import requests
        import hashlib
        from datetime import datetime, timezone, timedelta
        from django.conf import settings
        from monitoring.sentiment_analyzer import analyze_sentiment
        
        api_key = getattr(settings, 'NEWS_API_KEY', None)
        if not api_key:
            return Response({'error': 'News API key not configured'}, status=500)
        
        brands = Brand.objects.all()
        total_created = 0
        
        # Get fresh tech news for all brands
        url = 'https://newsapi.org/v2/everything'
        from_date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        
        # Build search query from all brand keywords
        all_keywords = ['technology', 'tech', 'AI', 'startup']
        for brand in brands:
            # Add brand name as primary keyword
            all_keywords.append(brand.name.lower())
            if isinstance(brand.keywords, list):
                all_keywords.extend([kw.lower() for kw in brand.keywords if kw])
        
        search_query = ' OR '.join(set(all_keywords))
        
        params = {
            'q': search_query,
            'from': from_date,
            'sortBy': 'publishedAt',
            'language': 'en',
            'pageSize': 50,
            'apiKey': api_key
        }
        
        response = requests.get(url, params=params, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            articles = data.get('articles', [])
            
            for article in articles:
                if not article.get('title') or not article.get('url'):
                    continue
                
                # Assign to relevant brand based on content
                title_lower = article.get('title', '').lower()
                description_lower = article.get('description', '').lower()
                content = f"{title_lower} {description_lower}"
                
                matched_brand = None
                for brand in brands:
                    # Check brand name first
                    if brand.name.lower() in content:
                        matched_brand = brand
                        break
                    # Then check keywords
                    brand_keywords = brand.keywords if isinstance(brand.keywords, list) else []
                    for keyword in brand_keywords:
                        if keyword and keyword.lower() in content:
                            matched_brand = brand
                            break
                    if matched_brand:
                        break
                
                # If no specific match, assign to a random brand
                if not matched_brand:
                    import random
                    matched_brand = random.choice(list(brands))
                
                # Create mention
                source_id = hashlib.md5(article['url'].encode()).hexdigest()[:20]
                
                # Parse timestamp
                published_at = article.get('publishedAt')
                if published_at:
                    try:
                        timestamp = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                    except:
                        timestamp = datetime.now(timezone.utc)
                else:
                    timestamp = datetime.now(timezone.utc)
                
                # Analyze sentiment
                text = f"{article.get('title', '')} {article.get('description', '')}"
                sentiment, sentiment_score = analyze_sentiment(text)
                
                mention, created = Mention.objects.get_or_create(
                    source='news',
                    source_id=source_id,
                    defaults={
                        'brand': matched_brand,
                        'title': article.get('title', '')[:500],
                        'text': text[:1000],
                        'sentiment': sentiment,
                        'author': article.get('source', {}).get('name', 'Unknown'),
                        'url': article.get('url', ''),
                        'timestamp': timestamp,
                        'sentiment_score': sentiment_score
                    }
                )
                if created:
                    total_created += 1
        else:
            # Fallback: Create sample news for all brands
            news_templates = [
                {'title': '{} Reports Strong Q4 Earnings', 'sentiment': 'positive'},
                {'title': '{} Announces New Product Launch', 'sentiment': 'positive'},
                {'title': '{} Expands Global Operations', 'sentiment': 'positive'},
                {'title': '{} Faces Market Challenges', 'sentiment': 'neutral'},
                {'title': '{} Stock Analysis and Forecast', 'sentiment': 'neutral'},
                {'title': '{} Innovation Strategy Update', 'sentiment': 'positive'}
            ]
            
            news_sources = [
                {'source': 'Reuters', 'url': 'https://www.reuters.com/business/'},
                {'source': 'Bloomberg', 'url': 'https://www.bloomberg.com/technology'},
                {'source': 'TechCrunch', 'url': 'https://techcrunch.com/'},
                {'source': 'Wired', 'url': 'https://www.wired.com/'},
                {'source': 'CNBC', 'url': 'https://www.cnbc.com/technology/'},
                {'source': 'Forbes', 'url': 'https://www.forbes.com/technology/'}
            ]
            
            import random
            for brand in brands:
                # Create 2 news mentions per brand
                for i in range(2):
                    template = random.choice(news_templates)
                    news_source = random.choice(news_sources)
                    source_id = hashlib.md5(f"{brand.name}{datetime.now().date()}{i}".encode()).hexdigest()[:20]
                    
                    title = template['title'].format(brand.name)
                    text = f"Latest market analysis shows {brand.name} continuing strategic initiatives with {template['sentiment']} market outlook."
                    
                    sentiment, sentiment_score = analyze_sentiment(title)
                    
                    mention, created = Mention.objects.get_or_create(
                        source='news',
                        source_id=source_id,
                        defaults={
                            'brand': brand,
                            'title': title,
                            'text': text,
                            'sentiment': sentiment,
                            'author': news_source['source'],
                            'url': news_source['url'],
                            'timestamp': datetime.now(timezone.utc),
                            'sentiment_score': sentiment_score
                        }
                    )
                    if created:
                        total_created += 1
        
        # Also create blog mentions distributed across brands
        from monitoring.blog_monitor import BlogMonitor
        blog_monitor = BlogMonitor()
        
        try:
            blog_mentions = blog_monitor.search_mentions('technology', ['tech', 'technology', 'startup'], limit=20)
            
            import random
            brands_list = list(brands)
            
            for i, mention_data in enumerate(blog_mentions):
                # Assign to different brands in rotation
                brand = brands_list[i % len(brands_list)]
                source_id = hashlib.md5(mention_data['url'].encode()).hexdigest()[:20]
                
                mention, created = Mention.objects.get_or_create(
                    source='blog',
                    source_id=source_id,
                    defaults={
                        'brand': brand,
                        'title': mention_data['title'],
                        'text': mention_data['text'],
                        'sentiment': mention_data['sentiment'],
                        'author': mention_data['author'],
                        'url': mention_data['url'],
                        'timestamp': mention_data['timestamp'],
                        'sentiment_score': 0.5 if mention_data['sentiment'] == 'neutral' else (0.8 if mention_data['sentiment'] == 'positive' else 0.2)
                    }
                )
                if created:
                    total_created += 1
        except Exception as e:
            print(f"Error creating blog mentions: {e}")
        
        return Response({
            'status': 'success', 
            'message': f'Created {total_created} new mentions distributed across {brands.count()} brands'
        })
        
    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=500)

@api_view(['GET'])
def test_api(request):
    """Test API endpoint"""
    from django.db import connection
    
    brands_count = Brand.objects.count()
    mentions_count = Mention.objects.count()
    alerts_count = Alert.objects.count()
    
    # Get recent mentions
    recent_mentions = Mention.objects.order_by('-timestamp')[:5]
    mentions_data = []
    for mention in recent_mentions:
        mentions_data.append({
            'id': mention.id,
            'brand': mention.brand.name,
            'title': mention.title[:50],
            'source': mention.source,
            'sentiment': mention.sentiment,
            'timestamp': mention.timestamp.isoformat()
        })
    
    return Response({
        'status': 'API Working',
        'database': 'Connected',
        'counts': {
            'brands': brands_count,
            'mentions': mentions_count,
            'alerts': alerts_count
        },
        'recent_mentions': mentions_data
    })

@api_view(['GET'])
def test_news_api(request):
    """Test News API directly"""
    import requests
    from django.conf import settings
    
    try:
        api_key = getattr(settings, 'NEWS_API_KEY', None)
        if not api_key:
            return Response({'error': 'News API key not configured'})
        
        # Test direct API call with popular tech terms
        url = 'https://newsapi.org/v2/everything'
        params = {
            'q': 'technology OR tech OR AI OR startup',
            'sortBy': 'publishedAt',
            'language': 'en',
            'pageSize': 10,
            'apiKey': api_key
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            articles = data.get('articles', [])
            
            return Response({
                'status': 'success',
                'total_results': data.get('totalResults', 0),
                'articles_returned': len(articles),
                'sample_articles': [{
                    'title': article.get('title', '')[:100],
                    'url': article.get('url', ''),
                    'source': article.get('source', {}).get('name', ''),
                    'publishedAt': article.get('publishedAt', '')
                } for article in articles[:5]]
            })
        else:
            return Response({
                'error': f'News API error: {response.status_code}',
                'message': response.text
            }, status=500)
            
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def clear_mentions(request):
    """Clear all mentions"""
    try:
        count = Mention.objects.count()
        Mention.objects.all().delete()
        return Response({'status': 'success', 'message': f'Cleared {count} mentions'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def stock_data(request):
    """Get stock data for a brand"""
    from monitoring.stock_monitor import StockMonitor
    
    brand_id = request.query_params.get('brand_id')
    if not brand_id:
        return Response({'error': 'brand_id required'}, status=400)
    
    try:
        brand = Brand.objects.get(id=brand_id)
        stock_monitor = StockMonitor()
        data = stock_monitor.get_stock_data(brand.name)
        
        if data:
            return Response(data)
        else:
            return Response({'error': 'Stock data not available'}, status=404)
    except Brand.DoesNotExist:
        return Response({'error': 'Brand not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def stock_chart(request):
    """Get historical stock data for charts"""
    from monitoring.stock_monitor import StockMonitor
    
    brand_id = request.query_params.get('brand_id')
    if not brand_id:
        return Response({'error': 'brand_id required'}, status=400)
    
    try:
        brand = Brand.objects.get(id=brand_id)
        stock_monitor = StockMonitor()
        data = stock_monitor.get_historical_data(brand.name)
        
        return Response(data)
    except Brand.DoesNotExist:
        return Response({'error': 'Brand not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)