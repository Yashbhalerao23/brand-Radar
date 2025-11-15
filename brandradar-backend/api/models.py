from django.db import models
from django.utils import timezone

class Brand(models.Model):
    name = models.CharField(max_length=100)
    keywords = models.JSONField(default=list)  # List of keywords to track
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class Mention(models.Model):
    SENTIMENT_CHOICES = [
        ('positive', 'Positive'),
        ('neutral', 'Neutral'),
        ('negative', 'Negative'),
    ]
    
    SOURCE_CHOICES = [
        ('reddit', 'Reddit'),
        ('twitter', 'Twitter'),
        ('news', 'News'),
        ('blog', 'Blog'),
    ]
    
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='mentions')
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    source_id = models.CharField(max_length=100)  # Original post/comment ID
    url = models.URLField()
    title = models.CharField(max_length=500, blank=True)
    text = models.TextField()
    author = models.CharField(max_length=100, blank=True)
    sentiment = models.CharField(max_length=10, choices=SENTIMENT_CHOICES)
    sentiment_score = models.FloatField(default=0.0)  # -1 to 1
    topic = models.CharField(max_length=100, blank=True)
    timestamp = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['source', 'source_id']
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.brand.name} - {self.source} - {self.sentiment}"

class Alert(models.Model):
    ALERT_TYPES = [
        ('spike', 'Mention Spike'),
        ('negative', 'Negative Sentiment'),
        ('trending', 'Trending Topic'),
    ]
    
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='alerts')
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    message = models.TextField()
    threshold_value = models.FloatField()
    current_value = models.FloatField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.brand.name} - {self.alert_type} - {self.message[:50]}"