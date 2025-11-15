import re
import random

def analyze_sentiment(text):
    """Simple sentiment analysis"""
    try:
        from textblob import TextBlob
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        
        if polarity > 0.1:
            sentiment = 'positive'
        elif polarity < -0.1:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
        
        return sentiment, polarity
    except ImportError:
        # Fallback to simple keyword-based sentiment
        positive_words = ['good', 'great', 'excellent', 'amazing', 'love', 'best']
        negative_words = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible']
        
        text_lower = text.lower()
        pos_count = sum(1 for word in positive_words if word in text_lower)
        neg_count = sum(1 for word in negative_words if word in text_lower)
        
        if pos_count > neg_count:
            return 'positive', 0.5
        elif neg_count > pos_count:
            return 'negative', -0.5
        else:
            return 'neutral', 0.0

def extract_topics(text, max_topics=5):
    """Extract main topic/theme from text"""
    # Clean text
    text = re.sub(r'[^a-zA-Z\s]', '', text.lower())
    words = text.split()
    
    # Remove common stop words
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'}
    
    filtered_words = [word for word in words if word not in stop_words and len(word) > 2]
    
    if not filtered_words:
        return 'general'
    
    # Get most frequent meaningful words
    word_freq = {}
    for word in filtered_words:
        word_freq[word] = word_freq.get(word, 0) + 1
    
    # Return most frequent word as topic
    if word_freq:
        topic = max(word_freq, key=word_freq.get)
        return topic
    
    return 'general'

def detect_spikes(brand, current_count, threshold_multiplier=2.0):
    """Detect mention spikes"""
    from django.utils import timezone
    from datetime import timedelta
    from api.models import Mention, Alert
    
    # Get average mentions per hour for the last week
    week_ago = timezone.now() - timedelta(days=7)
    hour_ago = timezone.now() - timedelta(hours=1)
    
    weekly_mentions = Mention.objects.filter(
        brand=brand,
        timestamp__gte=week_ago
    ).count()
    
    avg_per_hour = weekly_mentions / (7 * 24) if weekly_mentions > 0 else 1
    threshold = avg_per_hour * threshold_multiplier
    
    if current_count > threshold:
        # Create alert
        Alert.objects.get_or_create(
            brand=brand,
            alert_type='spike',
            defaults={
                'message': f'Mention spike detected: {current_count} mentions in the last hour (avg: {avg_per_hour:.1f})',
                'threshold_value': threshold,
                'current_value': current_count
            }
        )
        return True
    
    return False