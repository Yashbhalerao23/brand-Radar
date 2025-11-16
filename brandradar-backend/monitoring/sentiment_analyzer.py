from textblob import TextBlob

class SentimentAnalyzer:
    def __init__(self):
        pass
    
    def analyze_sentiment(self, text):
        """Analyze sentiment of text and return positive/negative/neutral"""
        try:
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity
            
            if polarity > 0.1:
                return 'positive'
            elif polarity < -0.1:
                return 'negative'
            else:
                return 'neutral'
        except Exception as e:
            print(f"Sentiment analysis error: {e}")
            return 'neutral'

# Standalone functions for backward compatibility
def analyze_sentiment(text):
    """Analyze sentiment of text and return (sentiment, score)"""
    try:
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        
        if polarity > 0.1:
            sentiment = 'positive'
        elif polarity < -0.1:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
            
        return sentiment, polarity
    except Exception as e:
        print(f"Sentiment analysis error: {e}")
        return 'neutral', 0.0

def extract_topics(text):
    """Extract topics from text (simple keyword extraction)"""
    try:
        blob = TextBlob(text)
        # Simple topic extraction using noun phrases
        topics = [str(phrase) for phrase in blob.noun_phrases if len(phrase) > 3]
        return topics[:5]  # Return top 5 topics
    except Exception as e:
        print(f"Topic extraction error: {e}")
        return []