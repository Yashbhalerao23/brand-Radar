from django.utils import timezone
from datetime import timedelta
from api.models import Brand, Mention, Alert
from .news_monitor import NewsMonitor

def monitor_brands():
    """Monitor brands using News API data"""
    news_monitor = NewsMonitor()
    total_saved = 0
    
    for brand in Brand.objects.all():
        try:
            print(f"Monitoring {brand.name} with keywords: {brand.keywords}")
            all_mentions = []
            
            # Get news mentions
            try:
                news_mentions = news_monitor.search_mentions(brand, limit=50)
                all_mentions.extend(news_mentions)
                print(f"Found {len(news_mentions)} news mentions for {brand.name}")
            except Exception as e:
                print(f"News API error for {brand.name}: {str(e)}")
            
            # Save all mentions to database
            saved_count = news_monitor.save_mentions(all_mentions)  # Reuse save method
            total_saved += saved_count
            
            # Check for spikes
            hour_ago = timezone.now() - timedelta(hours=1)
            recent_count = Mention.objects.filter(
                brand=brand,
                timestamp__gte=hour_ago
            ).count()
            
            # Create spike alert if more than 5 mentions in last hour
            if recent_count > 5:
                Alert.objects.get_or_create(
                    brand=brand,
                    alert_type='spike',
                    is_active=True,
                    defaults={
                        'message': f'Mention spike detected: {recent_count} mentions in the last hour',
                        'threshold_value': 5.0,
                        'current_value': float(recent_count)
                    }
                )
            
            # Check negative sentiment
            day_ago = timezone.now() - timedelta(days=1)
            recent_mentions = Mention.objects.filter(
                brand=brand,
                timestamp__gte=day_ago
            )
            
            if recent_mentions.exists():
                negative_count = recent_mentions.filter(sentiment='negative').count()
                total_count = recent_mentions.count()
                
                if total_count > 0:
                    negative_ratio = negative_count / total_count
                    
                    if negative_ratio > 0.5:  # 50% negative threshold
                        Alert.objects.get_or_create(
                            brand=brand,
                            alert_type='negative',
                            is_active=True,
                            defaults={
                                'message': f'High negative sentiment: {negative_ratio:.1%} of recent mentions',
                                'threshold_value': 0.5,
                                'current_value': negative_ratio
                            }
                        )
            
            print(f"Brand {brand.name}: {saved_count} new mentions saved")
            
        except Exception as e:
            print(f"Error monitoring brand {brand.name}: {str(e)}")
    
    return f"Total {total_saved} new mentions saved from News API"