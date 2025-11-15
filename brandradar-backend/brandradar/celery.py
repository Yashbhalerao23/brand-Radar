import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'brandradar.settings.development')

app = Celery('brandradar')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Periodic tasks
from celery.schedules import crontab

app.conf.beat_schedule = {
    'monitor-mentions': {
        'task': 'monitoring.tasks.monitor_brand_mentions',
        'schedule': crontab(minute='*/15'),  # Every 15 minutes
    },
    'cleanup-old-mentions': {
        'task': 'monitoring.tasks.cleanup_old_mentions',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
    },
}