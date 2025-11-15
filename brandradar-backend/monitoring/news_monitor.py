import requests
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from .sentiment_analyzer import analyze_sentiment, extract_topics

class NewsMonitor:
    def __init__(self):
        self.api_key = getattr(settings, 'NEWS_API_KEY', None)
        self.base_url = 'https://newsapi.org/v2/everything'
    
    def search_mentions(self, brand, limit=20):
        """Search for brand mentions in news articles"""
        if not self.api_key:
            print("News API key not configured")
            return []
        
        mentions = []
        
        for keyword in brand.keywords:
            try:
                # Search news from last 7 days
                from_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
                
                params = {
                    'q': keyword,
                    'from': from_date,
                    'sortBy': 'publishedAt',
                    'language': 'en',
                    'pageSize': min(limit // len(brand.keywords), 20),
                    'apiKey': self.api_key
                }
                
                response = requests.get(self.base_url, params=params, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    for article in data.get('articles', []):
                        mention_data = self._process_article(article, brand, keyword)
                        if mention_data:
                            mentions.append(mention_data)
                            
                elif response.status_code == 429:
                    print("News API rate limit exceeded")
                    break
                else:
                    print(f"News API error: {response.status_code} - {response.text}")
                    
            except Exception as e:
                print(f"Error fetching news for {keyword}: {str(e)}")
        
        return mentions
    
    def _process_article(self, article, brand, keyword):
        """Process news article"""
        title = article.get('title', '')
        description = article.get('description', '')
        content = article.get('content', '')
        
        # Skip if no content
        if not title and not description:
            return None
        
        # Combine text for analysis
        text = f"{title} {description}"
        if content:
            text += f" {content}"
        
        text = text[:1000]  # Limit text length
        
        # Check if keyword is mentioned
        if not self._contains_keyword(text, keyword):
            return None
        
        sentiment, sentiment_score = analyze_sentiment(text)
        topic = extract_topics(text)
        
        # Parse published date
        published_at = article.get('publishedAt')
        if published_at:
            try:
                timestamp = timezone.make_aware(datetime.fromisoformat(published_at.replace('Z', '+00:00')))
            except:
                timestamp = timezone.now()
        else:
            timestamp = timezone.now()
        
        return {
            'brand': brand,
            'source': 'news',
            'source_id': article.get('url', '').split('/')[-1][:50] or f"news_{int(timestamp.timestamp())}",
            'url': article.get('url', ''),
            'title': title[:500] if title else 'No title',
            'text': text,
            'author': article.get('source', {}).get('name', 'Unknown') if article.get('source') else 'Unknown',
            'sentiment': sentiment,
            'sentiment_score': sentiment_score,
            'topic': topic,
            'timestamp': timestamp
        }
    
    def _contains_keyword(self, text, keyword):
        """Check if text contains keyword (case insensitive)"""
        import re
        return re.search(rf'\b{re.escape(keyword)}\b', text, re.IGNORECASE) is not None
    
    def save_mentions(self, mentions_data):
        """Save mentions to database"""
        from api.models import Mention
        saved_count = 0
        
        for mention_data in mentions_data:
            mention, created = Mention.objects.get_or_create(
                source=mention_data['source'],
                source_id=mention_data['source_id'],
                defaults=mention_data
            )
            
            if created:
                saved_count += 1
        
        return saved_count