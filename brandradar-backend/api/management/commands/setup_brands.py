from django.core.management.base import BaseCommand
from api.models import Brand

class Command(BaseCommand):
    help = 'Setup initial brands for monitoring'
    
    def handle(self, *args, **options):
        # Create popular brands with relevant keywords
        brands_data = [
            {
                'name': 'Tesla', 
                'keywords': ['tesla', 'elon musk', 'model 3', 'model y', 'cybertruck', 'tesla stock']
            },
            {
                'name': 'Apple', 
                'keywords': ['apple', 'iphone', 'macbook', 'ipad', 'tim cook', 'apple stock']
            },
            {
                'name': 'Netflix', 
                'keywords': ['netflix', 'streaming', 'netflix original', 'netflix series']
            },
            {
                'name': 'Google', 
                'keywords': ['google', 'alphabet', 'android', 'chrome', 'youtube']
            },
            {
                'name': 'Microsoft', 
                'keywords': ['microsoft', 'windows', 'xbox', 'office 365', 'azure']
            },
            {
                'name': 'Amazon', 
                'keywords': ['amazon', 'aws', 'alexa', 'prime', 'jeff bezos']
            },
            {
                'name': 'Meta', 
                'keywords': ['meta', 'facebook', 'instagram', 'whatsapp', 'mark zuckerberg']
            },
            {
                'name': 'Spotify', 
                'keywords': ['spotify', 'music streaming', 'spotify premium', 'podcast']
            },
            {
                'name': 'Nike', 
                'keywords': ['nike', 'just do it', 'air jordan', 'swoosh', 'nike shoes']
            },
            {
                'name': 'Coca Cola', 
                'keywords': ['coca cola', 'coke', 'pepsi vs coke', 'coca-cola']
            },
            {
                'name': 'McDonalds', 
                'keywords': ['mcdonalds', 'big mac', 'happy meal', 'mcdonald\'s']
            },
            {
                'name': 'Starbucks', 
                'keywords': ['starbucks', 'coffee', 'frappuccino', 'starbucks menu']
            }
        ]
        
        for brand_data in brands_data:
            brand, created = Brand.objects.get_or_create(
                name=brand_data['name'],
                defaults={'keywords': brand_data['keywords']}
            )
            
            if created:
                self.stdout.write(f"Created brand: {brand.name}")
            else:
                self.stdout.write(f"Brand already exists: {brand.name}")
        
        self.stdout.write(self.style.SUCCESS(f'Setup complete! {len(brands_data)} brands ready for monitoring.'))