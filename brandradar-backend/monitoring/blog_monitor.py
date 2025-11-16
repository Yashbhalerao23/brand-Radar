import requests
import feedparser
from datetime import datetime, timezone
from .sentiment_analyzer import SentimentAnalyzer

class BlogMonitor:
    def __init__(self):
        self.sentiment_analyzer = SentimentAnalyzer()
        
        # Working blog RSS feeds
        self.blog_feeds = [
            'https://techcrunch.com/feed/',
            'https://www.theverge.com/rss/index.xml',
            'https://www.wired.com/feed/rss',
            'https://feeds.arstechnica.com/arstechnica/index'
        ]
    
    def search_mentions(self, brand_name, keywords, limit=20):
        """Get recent blog posts and assign them to brands based on content"""
        mentions = []
        
        # All brand terms for matching
        all_brand_terms = {
            'tesla': ['tesla', 'electric car', 'elon musk', 'autopilot', 'model s', 'model 3'],
            'apple': ['apple', 'iphone', 'ipad', 'mac', 'ios', 'app store', 'tim cook'],
            'google': ['google', 'android', 'chrome', 'gmail', 'youtube', 'pixel', 'alphabet'],
            'microsoft': ['microsoft', 'windows', 'office', 'xbox', 'azure', 'teams', 'satya'],
            'amazon': ['amazon', 'aws', 'prime', 'alexa', 'kindle', 'echo', 'bezos'],
            'meta': ['meta', 'facebook', 'instagram', 'whatsapp', 'oculus', 'zuckerberg'],
            'netflix': ['netflix', 'streaming', 'series', 'movies', 'binge', 'content'],
            'nike': ['nike', 'sneakers', 'jordan', 'swoosh', 'athletic', 'sports'],
            'spotify': ['spotify', 'music', 'playlist', 'podcast', 'streaming', 'audio'],
            'coca cola': ['coca cola', 'coke', 'soda', 'beverage', 'drink'],
            'mcdonalds': ['mcdonalds', 'burger', 'fast food', 'restaurant', 'fries'],
            'starbucks': ['starbucks', 'coffee', 'latte', 'cafe', 'espresso']
        }
        
        for feed_url in self.blog_feeds:
            try:
                feed = feedparser.parse(feed_url)
                
                for entry in feed.entries[:10]:  # Get recent posts
                    title = entry.get('title', '').lower()
                    summary = entry.get('summary', '').lower()
                    content = f"{title} {summary}"
                    
                    # Check which brand this post is about
                    matched_brand = None
                    for brand, terms in all_brand_terms.items():
                        for term in terms:
                            if term in content:
                                matched_brand = brand
                                break
                        if matched_brand:
                            break
                    
                    # If no specific brand match, assign to current brand being monitored
                    if not matched_brand:
                        matched_brand = brand_name.lower()
                    
                    # Only include if it matches the current brand or is tech-related
                    tech_keywords = ['technology', 'tech', 'innovation', 'startup', 'digital', 'ai', 'software']
                    is_tech_related = any(keyword in content for keyword in tech_keywords)
                    
                    if matched_brand == brand_name.lower() or is_tech_related:
                        mention = self._process_entry(entry, brand_name, feed.feed.get('title', 'Blog'))
                        if mention:
                            mentions.append(mention)
                            
            except Exception as e:
                print(f"Error parsing feed {feed_url}: {e}")
                continue
        
        return mentions[:limit]
    
    def _process_entry(self, entry, brand_name, blog_name):
        """Process blog entry into mention format"""
        try:
            title = entry.get('title', '')
            summary = entry.get('summary', '')
            text = f"{title}. {summary}"
            
            sentiment = self.sentiment_analyzer.analyze_sentiment(text)
            
            # Parse published date
            published = entry.get('published_parsed')
            if published:
                timestamp = datetime(*published[:6], tzinfo=timezone.utc)
            else:
                timestamp = datetime.now(timezone.utc)
            
            return {
                'brand': brand_name,
                'title': title,
                'text': text[:500],
                'sentiment': sentiment,
                'source': 'blog',
                'url': entry.get('link', '#'),
                'author': entry.get('author', blog_name),
                'timestamp': timestamp,
                'engagement': 0,
                'platform_data': {
                    'blog_name': blog_name,
                    'feed_url': entry.get('link', ''),
                    'tags': [tag.term for tag in entry.get('tags', [])]
                }
            }
        except Exception as e:
            print(f"Error processing blog entry: {e}")
            return None