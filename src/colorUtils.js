// colorUtils.js - Updated với functions cho layout mới
import { SENSOR_THRESHOLDS } from './thresholds.js';

// Enhanced interpolation for smooth gradients
export const interpolateColor = (color1, color2, factor) => {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');

  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);

  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);

  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);

  return `rgb(${r}, ${g}, ${b})`;
};

// Enhanced heatmap color calculation
export const getHeatmapColor = (value, min, max, thresholdType) => {
  if (value === 0 || isNaN(value)) return '#f3f4f6';
  
  const thresholds = SENSOR_THRESHOLDS[thresholdType] || SENSOR_THRESHOLDS.generic;
  
  // Normalize value to 0-1 range
  const ratio = Math.min(Math.max((value - min) / (max - min || 1), 0), 1);
  
  // Find appropriate color segment based on value ratio
  const segmentCount = thresholds.length - 1;
  const segmentIndex = Math.floor(ratio * segmentCount);
  const localRatio = (ratio * segmentCount) - segmentIndex;
  
  const startIndex = Math.min(segmentIndex, segmentCount - 1);
  const endIndex = Math.min(startIndex + 1, segmentCount);
  
  // Interpolate between two adjacent colors
  if (startIndex === endIndex) {
    return thresholds[startIndex].color;
  }
  
  return interpolateColor(
    thresholds[startIndex].color, 
    thresholds[endIndex].color, 
    localRatio
  );
};

// Tính độ tương phản để chọn màu text phù hợp
export const getContrastColor = (color) => {
  // Handle RGB format
  if (color.includes('rgb')) {
    const rgbMatch = color.match(/\d+/g);
    if (rgbMatch && rgbMatch.length >= 3) {
      const r = parseInt(rgbMatch[0]);
      const g = parseInt(rgbMatch[1]);
      const b = parseInt(rgbMatch[2]);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5 ? '#1f2937' : '#ffffff';
    }
  }
  
  // Handle hex format
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1f2937' : '#ffffff';
  }
  
  return '#1f2937'; // Default dark text
};

// Convert hex to rgba with alpha
export const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Create gradient from threshold for legend
export const createGradientFromThreshold = (thresholdType, direction = 'to right') => {
  const thresholds = SENSOR_THRESHOLDS[thresholdType] || SENSOR_THRESHOLDS.generic;
  const colors = thresholds.map(t => t.color).join(', ');
  return `linear-gradient(${direction}, ${colors})`;
};

// Get color palette for charts
export const getChartColorPalette = () => {
  return [
    '#dc2626', // Đỏ - Nhiệt độ
    '#2563eb', // Xanh dương - Độ ẩm  
    '#16a34a', // Xanh lá - CO
    '#ea580c', // Cam - MQ7
    '#7c3aed', // Tím - MQ2
    '#0891b2', // Xanh ngọc - Dust
    '#be123c', // Đỏ tươi - LPG
    '#374151'  // Xám - Smoke
  ];
};

// Status colors for different states
export const STATUS_COLORS = {
  good: '#22c55e',
  caution: '#eab308', 
  warning: '#f59e0b',
  critical: '#dc2626',
  unknown: '#6b7280'
};

// Generate color steps between two colors
export const generateColorSteps = (startColor, endColor, steps) => {
  const colors = [];
  for (let i = 0; i < steps; i++) {
    const factor = i / (steps - 1);
    colors.push(interpolateColor(startColor, endColor, factor));
  }
  return colors;
};

// Get appropriate text color for background
export const getTextColorForBackground = (backgroundColor) => {
  const color = getContrastColor(backgroundColor);
  return {
    color,
    fontWeight: color === '#ffffff' ? '600' : '500'
  };
};

// Create smooth gradient for heatmap legend
export const createHeatmapLegendGradient = (thresholdType) => {
  const thresholds = SENSOR_THRESHOLDS[thresholdType] || SENSOR_THRESHOLDS.generic;
  
  // Create more color stops for smoother gradient
  const colorStops = thresholds.map((threshold, index) => {
    const position = (index / (thresholds.length - 1)) * 100;
    return `${threshold.color} ${position}%`;
  }).join(', ');
  
  return `linear-gradient(to right, ${colorStops})`;
};

// Get threshold range info for display
export const getThresholdRangeText = (threshold, unit) => {
  if (threshold.min === undefined && threshold.max !== undefined) {
    return `< ${threshold.max}${unit}`;
  } else if (threshold.min !== undefined && threshold.max === undefined) {
    return `> ${threshold.min}${unit}`;
  } else if (threshold.min !== undefined && threshold.max !== undefined) {
    return `${threshold.min} - ${threshold.max}${unit}`;
  }
  return unit;
};