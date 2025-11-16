import React from 'react';

export const BrandRadarLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="50" r="45" fill="url(#gradient1)" stroke="#4fc3f7" strokeWidth="2"/>
    <circle cx="50" cy="50" r="30" fill="none" stroke="#81c784" strokeWidth="2" strokeDasharray="5,5">
      <animateTransform attributeName="transform" type="rotate" values="0 50 50;360 50 50" dur="3s" repeatCount="indefinite"/>
    </circle>
    <circle cx="50" cy="50" r="15" fill="none" stroke="#ff9800" strokeWidth="2" strokeDasharray="3,3">
      <animateTransform attributeName="transform" type="rotate" values="360 50 50;0 50 50" dur="2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="50" cy="50" r="6" fill="#fff"/>
    <text x="50" y="55" textAnchor="middle" fill="#333" fontSize="8" fontWeight="bold">BR</text>
    <defs>
      <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e3c72"/>
        <stop offset="100%" stopColor="#2a5298"/>
      </linearGradient>
    </defs>
  </svg>
);

export const getBrandLogo = (brandName, size = 24) => {
  const logos = {
    'Tesla': (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#dc2626"/>
        <path d="M20 40 L50 20 L80 40 L50 60 Z" fill="white"/>
        <circle cx="50" cy="70" r="8" fill="white"/>
      </svg>
    ),
    'Apple': (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#000"/>
        <path d="M45 25 C40 20, 35 25, 40 35 C35 40, 45 45, 50 40 C55 35, 60 30, 55 25 C50 20, 45 25, 45 25 Z" fill="white"/>
        <path d="M35 40 C30 35, 25 40, 30 50 C25 60, 35 70, 45 65 C55 70, 65 60, 60 50 C65 40, 60 35, 55 40 C50 35, 40 35, 35 40 Z" fill="white"/>
      </svg>
    ),
    'Netflix': (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#e50914"/>
        <rect x="20" y="20" width="15" height="60" fill="white"/>
        <rect x="42.5" y="20" width="15" height="60" fill="white"/>
        <rect x="65" y="20" width="15" height="60" fill="white"/>
        <path d="M20 20 L42.5 80 L57.5 80 L35 20 Z" fill="white"/>
      </svg>
    ),
    'Google': (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#4285f4"/>
        <circle cx="50" cy="50" r="25" fill="white"/>
        <path d="M50 30 A20 20 0 0 1 70 50 L60 50 A10 10 0 0 0 50 40 Z" fill="#ea4335"/>
        <path d="M30 50 A20 20 0 0 1 50 30 L50 40 A10 10 0 0 0 40 50 Z" fill="#fbbc05"/>
        <path d="M50 70 A20 20 0 0 1 30 50 L40 50 A10 10 0 0 0 50 60 Z" fill="#34a853"/>
        <path d="M70 50 A20 20 0 0 1 50 70 L50 60 A10 10 0 0 0 60 50 Z" fill="#4285f4"/>
      </svg>
    ),
    'Microsoft': (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#00a1f1"/>
        <rect x="20" y="20" width="25" height="25" fill="#f25022"/>
        <rect x="55" y="20" width="25" height="25" fill="#7fba00"/>
        <rect x="20" y="55" width="25" height="25" fill="#00a4ef"/>
        <rect x="55" y="55" width="25" height="25" fill="#ffb900"/>
      </svg>
    ),
    'Amazon': (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#ff9900"/>
        <path d="M25 60 Q50 75 75 60" stroke="white" strokeWidth="4" fill="none"/>
        <circle cx="30" cy="55" r="3" fill="white"/>
        <circle cx="70" cy="55" r="3" fill="white"/>
        <text x="50" y="45" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">a</text>
      </svg>
    ),
    'OpenAI': (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#10a37f"/>
        <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="3"/>
        <circle cx="50" cy="30" r="5" fill="white"/>
        <circle cx="70" cy="50" r="5" fill="white"/>
        <circle cx="50" cy="70" r="5" fill="white"/>
        <circle cx="30" cy="50" r="5" fill="white"/>
        <path d="M50 30 L70 50 L50 70 L30 50 Z" fill="none" stroke="white" strokeWidth="2"/>
      </svg>
    ),
    'Meta': (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#1877f2"/>
        <path d="M30 40 Q40 25 50 40 Q60 25 70 40 Q65 55 50 50 Q35 55 30 40 Z" fill="white"/>
        <circle cx="42" cy="42" r="3" fill="#1877f2"/>
        <circle cx="58" cy="42" r="3" fill="#1877f2"/>
      </svg>
    ),
    'Spotify': (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#1db954"/>
        <circle cx="50" cy="50" r="30" fill="white"/>
        <path d="M35 40 Q50 35 65 40" stroke="#1db954" strokeWidth="3" fill="none"/>
        <path d="M35 50 Q50 45 65 50" stroke="#1db954" strokeWidth="3" fill="none"/>
        <path d="M35 60 Q50 55 65 60" stroke="#1db954" strokeWidth="3" fill="none"/>
      </svg>
    ),
    'Nike': (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#000"/>
        <path d="M20 60 Q40 40 60 50 Q70 55 80 50" stroke="white" strokeWidth="6" fill="none"/>
      </svg>
    ),
    'Coca Cola': (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#f40009"/>
        <ellipse cx="50" cy="50" rx="25" ry="30" fill="white"/>
        <text x="50" y="55" textAnchor="middle" fill="#f40009" fontSize="12" fontWeight="bold">C</text>
      </svg>
    ),
    'McDonalds': (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#ffc72c"/>
        <path d="M30 70 Q35 30 45 70 Q50 30 55 70 Q65 30 70 70" stroke="#da020e" strokeWidth="4" fill="none"/>
      </svg>
    ),
    'Starbucks': (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#00704a"/>
        <circle cx="50" cy="50" r="25" fill="white"/>
        <circle cx="45" cy="45" r="2" fill="#00704a"/>
        <circle cx="55" cy="45" r="2" fill="#00704a"/>
        <path d="M40 55 Q50 60 60 55" stroke="#00704a" strokeWidth="2" fill="none"/>
        <path d="M35 35 Q50 25 65 35" stroke="#00704a" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'IBM': (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#1f70c1"/>
        <rect x="20" y="35" width="60" height="8" fill="white"/>
        <rect x="20" y="47" width="60" height="8" fill="white"/>
        <rect x="20" y="59" width="60" height="8" fill="white"/>
        <rect x="25" y="30" width="50" height="4" fill="white"/>
        <rect x="25" y="68" width="50" height="4" fill="white"/>
      </svg>
    )
  };

  return logos[brandName] || (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="20" fill="#6366f1"/>
      <text x="50" y="55" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">
        {brandName.charAt(0)}
      </text>
    </svg>
  );
};