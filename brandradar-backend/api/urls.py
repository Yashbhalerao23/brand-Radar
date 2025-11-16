from django.urls import path
from . import views

urlpatterns = [
    path('brands/', views.BrandListCreateView.as_view(), name='brand-list'),
    path('brands/<int:pk>/', views.BrandDetailView.as_view(), name='brand-detail'),
    path('mentions/', views.MentionListView.as_view(), name='mention-list'),
    path('alerts/', views.AlertListView.as_view(), name='alert-list'),
    path('alerts/<int:alert_id>/dismiss/', views.dismiss_alert, name='dismiss-alert'),
    path('stats/', views.sentiment_stats, name='sentiment-stats'),
    path('topics/', views.topic_stats, name='topic-stats'),
    path('sources/', views.source_stats, name='source-stats'),
    path('timeline/', views.timeline_stats, name='timeline-stats'),
    path('monitor/', views.trigger_monitoring, name='trigger-monitoring'),
    path('test/', views.test_api, name='test-api'),
    path('test-news/', views.test_news_api, name='test-news-api'),
    path('clear/', views.clear_mentions, name='clear-mentions'),
    path('stock/', views.stock_data, name='stock-data'),
    path('stock-chart/', views.stock_chart, name='stock-chart'),
]