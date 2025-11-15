# BrandRadar - Brand Intelligence Dashboard

A modern brand monitoring system that tracks mentions across global news sources, analyzes sentiment, and provides real-time insights through a professional dashboard.

## Features

- **📰 News Monitoring**: Track brand mentions across 50+ global news sources
- **😊 Sentiment Analysis**: Automatic categorization as positive, negative, or neutral
- **🚨 Smart Alerts**: Notifications for mention spikes and negative sentiment
- **📊 Analytics Dashboard**: Modern, responsive interface with real-time data
- **🏢 Brand Management**: Easy brand addition with keyword monitoring
- **📈 Export Data**: CSV export functionality for further analysis

## Tech Stack

- **Frontend**: React.js with Vite, Modern CSS with Glassmorphism
- **Backend**: Django REST Framework
- **Database**: SQLite (production-ready)
- **APIs**: News API for comprehensive news coverage
- **Monitoring**: Real-time sentiment analysis with TextBlob

## Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+

### Backend Setup

1. Navigate to backend directory:
```bash
cd brandradar-backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run migrations:
```bash
python manage.py migrate
```

4. Create sample brands:
```bash
python manage.py setup_brands
```

5. Start Django server:
```bash
python manage.py runserver
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd brandradar-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Open http://localhost:5173

## News API Setup

1. **Get API Key**: Go to https://newsapi.org/ and sign up for free
2. **Update .env**: Replace the API key in `brandradar-backend/.env`:
```
NEWS_API_KEY=your_actual_api_key
```

**Free Tier Includes:**
- ✅ 1,000 requests per day
- ✅ 50+ news sources
- ✅ Real-time updates
- ✅ Global coverage

## Usage

1. **🏢 Brand Management**: 
   - 12 popular brands pre-loaded (Tesla, Apple, Netflix, etc.)
   - Add custom brands with keywords using the + button
   - Click any brand to start monitoring

2. **📊 Dashboard Features**:
   - Real-time sentiment overview
   - Recent mentions with source links
   - Time-based filtering (24h, 7d, 30d)
   - Export data to CSV

3. **🚀 Monitoring**:
   - Click "Start Monitoring" to fetch latest mentions
   - Automatic sentiment analysis
   - Smart alerts for spikes and negative sentiment

## Project Structure

```
brandradar/
├── brandradar-backend/     # Django API Server
│   ├── api/               # REST endpoints & models
│   ├── monitoring/        # News monitoring & sentiment
│   └── brandradar/        # Django configuration
└── brandradar-frontend/   # React Dashboard
    └── src/components/    # Dashboard component
```

## API Endpoints

- `GET /api/brands/` - List all brands
- `POST /api/brands/` - Create new brand
- `GET /api/mentions/` - Recent brand mentions
- `GET /api/stats/` - Sentiment statistics
- `GET /api/alerts/` - Active alerts
- `POST /api/monitor/` - Trigger manual monitoring

## Features

**✅ Working Features:**
- Modern React dashboard with glassmorphism design
- 12 pre-loaded popular brands
- Add custom brands functionality
- News API integration for real mentions
- Sentiment analysis with TextBlob
- CSV export functionality
- Responsive design

**🔄 Sample Data Mode:**
- Works without backend (shows sample data)
- Perfect for demos and development
- Graceful fallback when API unavailable

## Screenshots

**Dashboard Overview:**
- Clean, modern interface
- Brand sidebar with icons
- Sentiment analytics cards
- Recent mentions grid

**Key Benefits:**
- 🚀 **Fast Setup** - Works in minutes
- 📱 **Responsive** - Mobile-friendly design
- 🎯 **Focused** - News-only monitoring for quality
- 💰 **Cost-effective** - Free News API tier
- 🔧 **Extensible** - Easy to add new features

## License

MIT License