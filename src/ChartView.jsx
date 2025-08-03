// ChartView.jsx - Component hiển thị biểu đồ
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { BarChart3, TrendingUp, Settings } from 'lucide-react';
import { getChartColorPalette } from './colorUtils.js';
import { getSensorConfig } from './sensorConfig.js';

const ChartView = ({ 
  data, 
  title = "Biểu đồ xu hướng theo thời gian",
  showControls = true,
  defaultChartType = 'line',
  height = 400 
}) => {
  const [chartType, setChartType] = useState(defaultChartType);
  const [selectedSensors, setSelectedSensors] = useState({
    temp: true,
    humidity: true,
    mq7CO: true,
    mq7Raw: false,
    mq2Raw: false,
    dust: true
  });
  const [showGrid, setShowGrid] = useState(true);
  const [showLegend, setShowLegend] = useState(true);

  const colors = getChartColorPalette();

  // Cấu hình các sensor lines
  const sensorConfigs = [
    { key: 'temp', name: 'Nhiệt độ (°C)', color: colors[0] },
    { key: 'humidity', name: 'Độ ẩm (%)', color: colors[1] },
    { key: 'mq7CO', name: 'CO (ppm)', color: colors[2] },
    { key: 'mq7Raw', name: 'MQ7 Raw', color: colors[3] },
    { key: 'mq2Raw', name: 'MQ2 Raw', color: colors[4] },
    { key: 'dust', name: 'Dust (μg/m³)', color: colors[5] }
  ];

  const toggleSensor = (sensorKey) => {
    setSelectedSensors(prev => ({
      ...prev,
      [sensorKey]: !prev[sensorKey]
    }));
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '12px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#1f2937' }}>
            Thời gian: {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ 
              margin: '4px 0', 
              color: entry.color,
              fontSize: '0.9rem'
            }}>
              {entry.name}: <strong>{entry.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const containerStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
    border: '1px solid #e5e7eb',
    margin: '16px 0'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '16px'
  };

  const titleStyle = {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const controlsStyle = {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap'
  };

  const buttonStyle = {
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: 'white',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease'
  };

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    color: 'white'
  };

  const sensorControlsStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '16px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px'
  };

  const sensorButtonStyle = (isSelected, color) => ({
    padding: '6px 12px',
    border: `2px solid ${isSelected ? color : '#d1d5db'}`,
    borderRadius: '6px',
    backgroundColor: isSelected ? `${color}15` : 'white',
    color: isSelected ? color : '#6b7280',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: isSelected ? '600' : 'normal',
    transition: 'all 0.2s ease'
  });

  return (
    <div className="chart-container" style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>
          <TrendingUp size={24} />
          {title}
        </h3>
        
        {showControls && (
          <div style={controlsStyle}>
            <button
              style={chartType === 'line' ? activeButtonStyle : buttonStyle}
              onClick={() => setChartType('line')}
            >
              📈 Line Chart
            </button>
            <button
              style={chartType === 'bar' ? activeButtonStyle : buttonStyle}
              onClick={() => setChartType('bar')}
            >
              📊 Bar Chart
            </button>
            
            <button
              style={showGrid ? activeButtonStyle : buttonStyle}
              onClick={() => setShowGrid(!showGrid)}
            >
              🔲 Grid
            </button>
            
            <button
              style={showLegend ? activeButtonStyle : buttonStyle}
              onClick={() => setShowLegend(!showLegend)}
            >
              📋 Legend
            </button>
          </div>
        )}
      </div>

      {/* Sensor selection controls */}
      <div style={sensorControlsStyle}>
        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginRight: '12px', display: 'flex', alignItems: 'center' }}>
          <Settings size={16} style={{ marginRight: '6px' }} />
          Chọn sensors:
        </div>
        {sensorConfigs.map((sensor) => (
          <button
            key={sensor.key}
            style={sensorButtonStyle(selectedSensors[sensor.key], sensor.color)}
            onClick={() => toggleSensor(sensor.key)}
            onMouseEnter={(e) => {
              if (!selectedSensors[sensor.key]) {
                e.target.style.borderColor = sensor.color;
                e.target.style.backgroundColor = `${sensor.color}10`;
              }
            }}
            onMouseLeave={(e) => {
              if (!selectedSensors[sensor.key]) {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.backgroundColor = 'white';
              }
            }}
          >
            {sensor.name}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        {chartType === 'line' ? (
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey="time" 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => value.length > 8 ? value.substring(0, 5) : value}
            />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            
            {sensorConfigs.map((sensor) => 
              selectedSensors[sensor.key] && (
                <Line
                  key={sensor.key}
                  type="monotone"
                  dataKey={sensor.key}
                  stroke={sensor.color}
                  strokeWidth={2}
                  name={sensor.name}
                  dot={{ r: 3, fill: sensor.color }}
                  activeDot={{ r: 6, fill: sensor.color }}
                />
              )
            )}
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey="time" 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => value.length > 8 ? value.substring(0, 5) : value}
            />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            
            {sensorConfigs.map((sensor) => 
              selectedSensors[sensor.key] && (
                <Bar
                  key={sensor.key}
                  dataKey={sensor.key}
                  fill={sensor.color}
                  name={sensor.name}
                  radius={[2, 2, 0, 0]}
                />
              )
            )}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartView;