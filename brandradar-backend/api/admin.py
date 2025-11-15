from django.contrib import admin
from .models import Brand, Mention, Alert

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']

@admin.register(Mention)
class MentionAdmin(admin.ModelAdmin):
    list_display = ['brand', 'source', 'sentiment', 'topic', 'timestamp']
    list_filter = ['source', 'sentiment', 'brand']
    search_fields = ['text', 'title', 'author']
    date_hierarchy = 'timestamp'

@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ['brand', 'alert_type', 'is_active', 'created_at']
    list_filter = ['alert_type', 'is_active', 'brand']