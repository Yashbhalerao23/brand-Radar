import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StockChart = ({ data, type = 'line' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-placeholder">
        <div className="chart-icon">📈</div>
        <p>No stock data available</p>
      </div>
    );
  }

  const chartData = {
    labels: data.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Stock Price ($)',
        data: data.map(item => item.close),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const volumeData = {
    labels: data.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Volume',
        data: data.map(item => item.volume),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: type === 'volume' ? 'Trading Volume' : 'Stock Price Trend',
      },
    },
    scales: {
      y: {
        beginAtZero: type === 'volume',
      },
    },
  };

  if (type === 'volume') {
    return <Bar data={volumeData} options={options} />;
  }

  return <Line data={chartData} options={options} />;
};

export default StockChart;