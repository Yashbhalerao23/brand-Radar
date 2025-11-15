from django.core.management.base import BaseCommand
from monitoring.monitor_service import monitor_brands

class Command(BaseCommand):
    help = 'Run brand monitoring manually'
    
    def handle(self, *args, **options):
        self.stdout.write('Starting brand monitoring...')
        result = monitor_brands()
        self.stdout.write(self.style.SUCCESS(result))