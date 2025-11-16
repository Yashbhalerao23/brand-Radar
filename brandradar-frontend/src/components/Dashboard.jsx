import React, { useEffect, useState } from "react";
import jsPDF from 'jspdf';
import StockChart from './StockChart';
import { BrandRadarLogo, getBrandLogo } from './BrandLogos';
import "./Dashboard.css";
import "./StockStyles.css";
import "./LogoStyles.css";

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
  const [stockData, setStockData] = useState(null);
  const [stockChart, setStockChart] = useState([]);
  const [showStocks, setShowStocks] = useState(false);

  useEffect(() => {
    loadBrands();
    // Auto-refresh data every 60 seconds
    const dataInterval = setInterval(() => {
      if (selectedBrand) loadData();
    }, 60000);
    
    // Auto-refresh stock data every 30 seconds for real-time updates
    const stockInterval = setInterval(() => {
      if (selectedBrand && showStocks) loadStockData();
    }, 30000);
    
    return () => {
      clearInterval(dataInterval);
      clearInterval(stockInterval);
    };
  }, [selectedBrand, showStocks]);

  // Add sample brands if none exist
  useEffect(() => {
    if (brands.length === 0) {
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
    }
  }, [brands]);

  useEffect(() => {
    if (selectedBrand) {
      loadData();
      loadStockData();
    }
  }, [selectedBrand, timeFilter, sourceFilter]);

  const loadBrands = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/brands/');
      const data = await response.json();
      const brandsArray = Array.isArray(data) ? data : (data.results || []);
      
      if (brandsArray.length > 0) {
        setBrands(brandsArray);
        if (!selectedBrand) {
          setSelectedBrand(brandsArray[0]);
        }
      } else {
        // If no brands in database, use sample brands but don't set them in state yet
        console.log('No brands found in database, using sample brands');
      }
    } catch (error) {
      console.error('Error loading brands:', error);
      // Backend not running, keep sample brands
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
      
      // Also refresh stock data
      loadStockData();
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Backend not running. Start Django server to see real blog data.', 'warning');
      setMentions([]);
      setStats({});
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const addBrand = async (e) => {
    e.preventDefault();
    if (!newBrand.name) return;

    try {
      const brandData = {
        name: newBrand.name,
        keywords: [newBrand.name.toLowerCase()]
      };
      
      const response = await fetch('http://localhost:8000/api/brands/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(brandData)
      });
      
      if (response.ok) {
        const newBrandFromServer = await response.json();
        setBrands(prev => [...prev, newBrandFromServer]);
        setSelectedBrand(newBrandFromServer);
        setNewBrand({ name: '', keywords: '' });
        setShowAddForm(false);
        showNotification(`Brand "${newBrandFromServer.name}" added successfully!`, 'success');
        
        // Automatically trigger monitoring for the new brand
        setTimeout(() => {
          startMonitoring();
        }, 1000);
      } else {
        throw new Error('Failed to create brand');
      }
    } catch (error) {
      console.error('Error adding brand:', error);
      showNotification('Failed to add brand to database', 'error');
    }
  };

  const removeBrand = async (brandId, brandName) => {
    if (!confirm(`Are you sure you want to remove "${brandName}"?`)) return;

    try {
      const response = await fetch(`http://localhost:8000/api/brands/${brandId}/`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setBrands(prev => prev.filter(brand => brand.id !== brandId));
        if (selectedBrand?.id === brandId) {
          setSelectedBrand(brands.find(b => b.id !== brandId) || null);
        }
        showNotification(`Brand "${brandName}" removed successfully!`, 'success');
      } else {
        throw new Error('Failed to remove brand');
      }
    } catch (error) {
      console.error('Error removing brand:', error);
      showNotification('Failed to remove brand from database', 'error');
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



  const exportPDF = () => {
    if (!mentions.length) {
      showNotification('No data to export', 'warning');
      return;
    }

    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.height;
    let yPosition = 20;

    // Header
    pdf.setFontSize(20);
    pdf.text('BrandRadar Report', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(14);
    pdf.text(`Brand: ${selectedBrand?.name || 'Unknown'}`, 20, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(12);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 15;

    // Stats
    pdf.setFontSize(16);
    pdf.text('Sentiment Overview', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(12);
    pdf.text(`Total Mentions: ${totalMentions}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Positive: ${stats.positive || 0} (${stats.positive_pct || 0}%)`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Neutral: ${stats.neutral || 0} (${stats.neutral_pct || 0}%)`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Negative: ${stats.negative || 0} (${stats.negative_pct || 0}%)`, 20, yPosition);
    yPosition += 15;

    // Mentions
    pdf.setFontSize(16);
    pdf.text('Recent Mentions', 20, yPosition);
    yPosition += 10;

    mentions.slice(0, 20).forEach((mention, index) => {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(12);
      pdf.text(`${index + 1}. ${mention.title || 'No title'}`, 20, yPosition);
      yPosition += 6;
      
      pdf.setFontSize(10);
      pdf.text(`Source: ${mention.source} | Sentiment: ${mention.sentiment}`, 25, yPosition);
      yPosition += 5;
      pdf.text(`Author: ${mention.author} | Date: ${mention.timestamp ? new Date(mention.timestamp).toLocaleDateString() : 'No date'}`, 25, yPosition);
      yPosition += 8;
    });

    pdf.save(`${selectedBrand?.name || 'brand'}_report_${new Date().toISOString().split('T')[0]}.pdf`);
    showNotification('PDF exported successfully!', 'success');
  };



  const loadStockData = async () => {
    if (!selectedBrand) return;
    
    try {
      const [stockRes, chartRes] = await Promise.all([
        fetch(`http://localhost:8000/api/stock/?brand_id=${selectedBrand.id}`),
        fetch(`http://localhost:8000/api/stock-chart/?brand_id=${selectedBrand.id}`)
      ]);
      
      if (stockRes.ok) {
        const stockData = await stockRes.json();
        setStockData(stockData);
        
        // Show real-time update notification only for subsequent updates
        if (showStocks && stockData.price) {
          console.log(`Stock updated: ${selectedBrand.name} - $${stockData.price}`);
        }
      }
      
      if (chartRes.ok) {
        const chartData = await chartRes.json();
        console.log('Chart data loaded:', chartData.length, 'data points');
        setStockChart(chartData);
      }
    } catch (error) {
      console.error('Error loading stock data:', error);
      showNotification('Using sample stock data for demo', 'info');
      
      // Generate sample stock data for demo
      setStockData({
        symbol: 'DEMO',
        price: 150.25,
        change: 2.45,
        change_percent: '1.65',
        volume: 1250000,
        high: 152.80,
        low: 148.90
      });
      
      // Generate sample chart data
      const sampleChart = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        sampleChart.push({
          date: date.toISOString().split('T')[0],
          close: 150 + Math.random() * 20 - 10,
          volume: Math.floor(Math.random() * 20000000) + 5000000
        });
      }
      setStockChart(sampleChart);
    }
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
    const icons = { news: '📰', blog: '📝' };
    return icons[source] || '📰';
  };

  const totalMentions = (stats.positive || 0) + (stats.neutral || 0) + (stats.negative || 0);

  return (
    <div className="dashboard">
        {/* Sidebar */}
        <div className="sidebar">
        <div className="sidebar-header">
          <div className="brand-radar-logo">
            <BrandRadarLogo size={28} />
            <h3>BrandRadar</h3>
          </div>
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
              >
                <div className="brand-content" onClick={() => setSelectedBrand(brand)}>
                  <div className="brand-logo">{getBrandLogo(brand.name, 32)}</div>
                  <div className="brand-info">
                    <strong>{brand.name}</strong>
                  </div>
                </div>
                <button 
                  className="remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBrand(brand.id, brand.name);
                  }}
                  title={`Remove ${brand.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <div className="header-left">
            <div className="header-logo">
              <BrandRadarLogo size={40} />
              <div>
                <h1>BrandRadar</h1>
                <p>Real-time Brand Intelligence Dashboard</p>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button onClick={startMonitoring} disabled={loading} className="action-btn primary">
              {loading ? '🔄 Monitoring...' : '🚀 Start Monitoring'}
            </button>
            <button onClick={exportPDF} className="action-btn">
              📄 Export PDF
            </button>
            <button onClick={() => setShowStocks(!showStocks)} className="action-btn">
              📈 {showStocks ? 'Hide' : 'Show'} Stocks
            </button>
            {showStocks && (
              <div className="real-time-indicator">
                🔴 LIVE
              </div>
            )}
          </div>
        </div>

        {/* Brand Header */}
        {selectedBrand && (
          <div className="brand-section">
            <div className="brand-info">
              <div className="brand-logo-xl">{getBrandLogo(selectedBrand.name, 48)}</div>
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

            {/* Stock Data */}
            {showStocks && stockData && (
              <div className="stock-section">
                <div className="stock-header">
                  <h3>📈 Stock Performance</h3>
                  <div className="stock-meta">
                    <span className="live-indicator">🔴 LIVE</span>
                    <span className="last-updated">
                      Updated: {stockData.timestamp ? new Date(stockData.timestamp).toLocaleTimeString() : 'Now'}
                    </span>
                  </div>
                </div>
                <div className="stock-overview">
                  <div className="stock-symbol">
                    <span className="symbol-badge">{stockData.symbol}</span>
                    <span className="brand-name">{selectedBrand.name}</span>
                  </div>
                </div>
                
                <div className="stock-grid">
                  <div className="stock-card price">
                    <div className="stock-icon">💰</div>
                    <div className="stock-content">
                      <div className="stock-number">${stockData.price}</div>
                      <div className="stock-label">Current Price</div>
                      <div className={`stock-change ${stockData.change >= 0 ? 'positive' : 'negative'}`}>
                        {stockData.change >= 0 ? '+' : ''}{stockData.change} ({stockData.change_percent}%)
                      </div>
                    </div>
                  </div>
                  <div className="stock-card volume">
                    <div className="stock-icon">📉</div>
                    <div className="stock-content">
                      <div className="stock-number">{(stockData.volume / 1000000).toFixed(1)}M</div>
                      <div className="stock-label">Volume</div>
                    </div>
                  </div>
                  <div className="stock-card high">
                    <div className="stock-icon">⬆️</div>
                    <div className="stock-content">
                      <div className="stock-number">${stockData.high}</div>
                      <div className="stock-label">Day High</div>
                    </div>
                  </div>
                  <div className="stock-card low">
                    <div className="stock-icon">⬇️</div>
                    <div className="stock-content">
                      <div className="stock-number">${stockData.low}</div>
                      <div className="stock-label">Day Low</div>
                    </div>
                  </div>
                </div>
                
                {/* Stock Charts */}
                <div className="charts-section">
                  <div className="chart-container">
                    <h4>📈 Price Trend (30 Days)</h4>
                    {stockChart && stockChart.length > 0 ? (
                      <StockChart data={stockChart} type="line" />
                    ) : (
                      <div className="chart-loading">
                        <div className="loading-spinner">🔄</div>
                        <p>Loading chart data...</p>
                      </div>
                    )}
                  </div>
                  <div className="chart-container">
                    <h4>📉 Trading Volume</h4>
                    {stockChart && stockChart.length > 0 ? (
                      <StockChart data={stockChart} type="volume" />
                    ) : (
                      <div className="chart-loading">
                        <div className="loading-spinner">🔄</div>
                        <p>Loading chart data...</p>
                      </div>
                    )}
                  </div>
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
                    <option value="blog">📝 Blogs</option>
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