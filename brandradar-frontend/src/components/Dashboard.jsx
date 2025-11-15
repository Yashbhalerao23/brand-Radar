import React, { useEffect, useState } from "react";
import "./Dashboard.css";

const Dashboard = () => {
  const [brands, setBrands] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [stats, setStats] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBrand, setNewBrand] = useState({ name: '', keywords: '' });
  const [timeFilter, setTimeFilter] = useState(7);
  const [sourceFilter, setSourceFilter] = useState('');

  useEffect(() => {
    loadBrands();
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      if (selectedBrand) loadData();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Add sample brands if none exist
  useEffect(() => {
    const sampleBrands = [
      { id: 1, name: 'Tesla', keywords: 'tesla,electric car,elon musk' },
      { id: 2, name: 'Apple', keywords: 'apple,iphone,ipad,mac' },
      { id: 3, name: 'Netflix', keywords: 'netflix,streaming,series' },
      { id: 4, name: 'Google', keywords: 'google,search,android' },
      { id: 5, name: 'Microsoft', keywords: 'microsoft,windows,office' },
      { id: 6, name: 'Amazon', keywords: 'amazon,aws,prime' },
      { id: 7, name: 'Meta', keywords: 'meta,facebook,instagram' },
      { id: 8, name: 'Spotify', keywords: 'spotify,music,streaming' },
      { id: 9, name: 'Nike', keywords: 'nike,shoes,sports' },
      { id: 10, name: 'Coca Cola', keywords: 'coca cola,coke,soda' },
      { id: 11, name: 'McDonalds', keywords: 'mcdonalds,burger,fast food' },
      { id: 12, name: 'Starbucks', keywords: 'starbucks,coffee,latte' }
    ];
    setBrands(sampleBrands);
    if (!selectedBrand) {
      setSelectedBrand(sampleBrands[0]);
    }
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      loadData();
    }
  }, [selectedBrand, timeFilter, sourceFilter]);

  const loadBrands = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/brands/');
      const data = await response.json();
      const brandsArray = Array.isArray(data) ? data : (data.results || []);
      setBrands(brandsArray);
      if (brandsArray.length > 0 && !selectedBrand) {
        setSelectedBrand(brandsArray[0]);
      }
    } catch (error) {
      console.error('Error loading brands:', error);
      setBrands([]);
    }
  };

  const loadData = async () => {
    if (!selectedBrand) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        brand_id: selectedBrand.id,
        days: timeFilter,
        ...(sourceFilter && { source: sourceFilter })
      });

      const [mentionsRes, statsRes, alertsRes] = await Promise.all([
        fetch(`http://localhost:8000/api/mentions/?${params}`),
        fetch(`http://localhost:8000/api/stats/?${params}`),
        fetch('http://localhost:8000/api/alerts/')
      ]);

      const mentionsData = await mentionsRes.json();
      const statsData = await statsRes.json();
      const alertsData = await alertsRes.json();

      setMentions(mentionsData.results || mentionsData || []);
      setStats(statsData || {});
      setAlerts(alertsData.results || alertsData || []);
      
      showNotification('Data refreshed successfully!', 'success');
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Failed to refresh data. Using sample data.', 'warning');
      
      // Set sample data when API fails
      setMentions([
        {
          id: 1,
          title: `${selectedBrand.name} Latest News`,
          text: `Recent developments and updates about ${selectedBrand.name} in the market.`,
          sentiment: 'positive',
          source: 'news',
          author: 'News Reporter',
          timestamp: new Date().toISOString(),
          url: '#'
        }
      ]);
      setStats({ positive: 15, neutral: 8, negative: 2, positive_pct: 60, neutral_pct: 32, negative_pct: 8 });
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const addBrand = async (e) => {
    e.preventDefault();
    if (!newBrand.name || !newBrand.keywords) return;

    try {
      const newId = Math.max(...brands.map(b => b.id)) + 1;
      const brand = {
        id: newId,
        name: newBrand.name,
        keywords: newBrand.keywords
      };
      
      setBrands(prev => [...prev, brand]);
      setSelectedBrand(brand);
      setNewBrand({ name: '', keywords: '' });
      setShowAddForm(false);
      showNotification(`Brand "${brand.name}" added successfully!`, 'success');
    } catch (error) {
      console.error('Error adding brand:', error);
      showNotification('Failed to add brand', 'error');
    }
  };

  const startMonitoring = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/monitor/', {
        method: 'POST'
      });
      const result = await response.json();
      
      // Show success notification
      showNotification(result.message || 'Monitoring completed successfully!', 'success');
      loadData();
    } catch (error) {
      showNotification('Monitoring failed: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type) => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const exportData = () => {
    if (!mentions.length) {
      showNotification('No data to export', 'warning');
      return;
    }

    const csvContent = [
      ['Brand', 'Source', 'Title', 'Text', 'Sentiment', 'Author', 'Date'],
      ...mentions.map(m => [
        selectedBrand?.name || '',
        m.source || '',
        m.title || '',
        m.text?.replace(/,/g, ';') || '',
        m.sentiment || '',
        m.author || '',
        m.timestamp ? new Date(m.timestamp).toLocaleDateString() : ''
      ])
    ].map(row => row.join(',')).join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedBrand?.name || 'brand'}_mentions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully!', 'success');
  };

  const getBrandIcon = (brandName) => {
    const icons = {
      'Tesla': '🚗', 'Apple': '🍎', 'Netflix': '🎬', 'Google': '🔍',
      'Microsoft': '💻', 'Amazon': '📦', 'Meta': '👥', 'Spotify': '🎵',
      'Nike': '👟', 'Coca Cola': '🥤', 'McDonalds': '🍔', 'Starbucks': '☕'
    };
    return icons[brandName] || '🏢';
  };

  const getSentimentIcon = (sentiment) => {
    const icons = { positive: '😊', neutral: '😐', negative: '😞' };
    return icons[sentiment] || '😐';
  };

  const getSourceIcon = (source) => {
    const icons = { news: '📰' };
    return icons[source] || '📰';
  };

  const totalMentions = (stats.positive || 0) + (stats.neutral || 0) + (stats.negative || 0);

  return (
    <div className="dashboard">
        {/* Sidebar */}
        <div className="sidebar">
        <div className="sidebar-header">
          <h3>🏢 Brands</h3>
        </div>

        <div className="sidebar-section">
          <div className="section-title">
            <span>({brands.length})</span>
            <button onClick={() => setShowAddForm(!showAddForm)} className="add-btn">+</button>
          </div>

          {showAddForm && (
            <form onSubmit={addBrand} className="add-form">
              <input
                type="text"
                placeholder="Brand name"
                value={newBrand.name}
                onChange={(e) => setNewBrand({...newBrand, name: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Keywords (comma separated)"
                value={newBrand.keywords}
                onChange={(e) => setNewBrand({...newBrand, keywords: e.target.value})}
                required
              />
              <div className="form-buttons">
                <button type="submit">✓</button>
                <button type="button" onClick={() => setShowAddForm(false)}>✕</button>
              </div>
            </form>
          )}

          <div className="brands-list">
            {Array.isArray(brands) && brands.map(brand => (
              <div
                key={brand.id}
                className={`brand-item ${selectedBrand?.id === brand.id ? 'selected' : ''}`}
                onClick={() => setSelectedBrand(brand)}
              >
                <div className="brand-icon">{getBrandIcon(brand.name)}</div>
                <div className="brand-info">
                  <strong>{brand.name}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="sidebar-section">
          <h3>🔍 Filters</h3>
          <div className="filter-group">
            <label>Time Range</label>
            <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Source</label>
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
              <option value="">All Sources</option>
              <option value="news">📰 News</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <div className="header-left">
            <h1>🎯 BrandRadar</h1>
            <p>Real-time Brand Intelligence Dashboard</p>
          </div>
          <div className="header-actions">
            <button onClick={startMonitoring} disabled={loading} className="action-btn primary">
              {loading ? '🔄 Monitoring...' : '🚀 Start Monitoring'}
            </button>
            <button onClick={loadData} disabled={loading} className="action-btn">
              ↻ Refresh
            </button>
            <button onClick={exportData} className="action-btn">
              📊 Export Data
            </button>
          </div>
        </div>

        {/* Brand Header */}
        {selectedBrand && (
          <div className="brand-section">
            <div className="brand-info">
              <span className="brand-icon-xl">{getBrandIcon(selectedBrand.name)}</span>
              <div>
                <h2>{selectedBrand.name}</h2>
                <p>Monitoring {selectedBrand.keywords?.length || 0} keywords across multiple platforms</p>
              </div>
            </div>
          </div>
        )}

        {selectedBrand ? (
          <>
            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="alerts-section">
                <h3>🚨 Active Alerts</h3>
                <div className="alerts-grid">
                  {alerts.map(alert => (
                    <div key={alert.id} className={`alert-card ${alert.alert_type}`}>
                      <div className="alert-icon">🚨</div>
                      <div className="alert-content">
                        <h4>{alert.alert_type} Alert</h4>
                        <p>{alert.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="stats-section">
              <h3>📊 Sentiment Overview</h3>
              <div className="stats-grid">
                <div className="stat-card total">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <div className="stat-number">{totalMentions}</div>
                    <div className="stat-label">Total Mentions</div>
                  </div>
                </div>
                <div className="stat-card positive">
                  <div className="stat-icon">😊</div>
                  <div className="stat-content">
                    <div className="stat-number">{stats.positive || 0}</div>
                    <div className="stat-label">Positive ({stats.positive_pct || 0}%)</div>
                  </div>
                </div>
                <div className="stat-card neutral">
                  <div className="stat-icon">😐</div>
                  <div className="stat-content">
                    <div className="stat-number">{stats.neutral || 0}</div>
                    <div className="stat-label">Neutral ({stats.neutral_pct || 0}%)</div>
                  </div>
                </div>
                <div className="stat-card negative">
                  <div className="stat-icon">😞</div>
                  <div className="stat-content">
                    <div className="stat-number">{stats.negative || 0}</div>
                    <div className="stat-label">Negative ({stats.negative_pct || 0}%)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mentions */}
            <div className="mentions-section">
              <div className="section-header">
                <h3>📰 Recent Mentions ({Array.isArray(mentions) ? mentions.length : 0})</h3>
                <div className="filters">
                  <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="filter-select">
                    <option value={1}>Last 24 hours</option>
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                  </select>
                  <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="filter-select">
                    <option value="">All Sources</option>
                    <option value="news">📰 News</option>
                  </select>
                </div>
              </div>
              
              <div className="mentions-grid">
                {Array.isArray(mentions) && mentions.length > 0 ? (
                  mentions.map(mention => (
                    <div key={mention.id} className="mention-card">
                      <div className="mention-header">
                        <div className="source-badge">
                          <span className="source-icon">{getSourceIcon(mention.source)}</span>
                          <span className="source-name">{mention.source}</span>
                        </div>
                        <div className={`sentiment-badge ${mention.sentiment}`}>
                          <span>{getSentimentIcon(mention.sentiment)}</span>
                          <span>{mention.sentiment}</span>
                        </div>
                      </div>
                      
                      {mention.title && (
                        <h4 className="mention-title">
                          <a href={mention.url} target="_blank" rel="noopener noreferrer">
                            {mention.title}
                          </a>
                        </h4>
                      )}
                      
                      <p className="mention-text">{mention.text}</p>
                      
                      <div className="mention-footer">
                        <span className="author">👤 {mention.author}</span>
                        <span className="timestamp">
                          🕒 {mention.timestamp ? new Date(mention.timestamp).toLocaleDateString() : 'No date'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>No mentions found</h3>
                    <p>Start monitoring to collect brand mentions from news sources worldwide.</p>
                    <button onClick={startMonitoring} className="start-btn">
                      🚀 Start Monitoring
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="welcome-state">
            <div className="welcome-icon">🎯</div>
            <h2>Welcome to BrandRadar</h2>
            <p>Select a brand from the sidebar to start monitoring mentions from global news sources.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;