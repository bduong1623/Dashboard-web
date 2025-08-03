// ChartView.jsx - Enhanced with sensor-specific smart recommendations
import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, ScatterChart, Scatter
} from 'recharts';
import { BarChart3, TrendingUp, Settings, Lightbulb, AlertCircle, ThermometerSun, Droplets, AlertTriangle, Wind } from 'lucide-react';

// ===== SENSOR-SPECIFIC CHART RECOMMENDATIONS =====
const SENSOR_CHART_RECOMMENDATIONS = {
  // Nhiệt độ (field1) - Liên tục (°C)
  temp: {
    name: 'Nhiệt độ',
    unit: '°C',
    fieldKey: 'field1',
    icon: '🌡️',
    iconComponent: ThermometerSun,
    dataType: 'continuous',
    primary: 'line',
    secondary: ['area', 'scatter'],
    reasoning: 'Nhiệt độ thay đổi liên tục theo thời gian. Line Chart cho thấy xu hướng biến thiên rõ ràng nhất, phù hợp để theo dõi chu kỳ nhiệt và phát hiện bất thường.',
    chartTypes: {
      line: 'Tốt nhất cho xu hướng nhiệt độ theo thời gian',
      area: 'Hiển thị vùng nhiệt độ, dễ thấy biên độ thay đổi',
      scatter: 'Phát hiện mối tương quan và ngoại lệ nhiệt độ',
      bar: 'Không phù hợp - nhiệt độ là dữ liệu liên tục'
    },
    thresholds: {
      optimal: [20, 25],
      warning: [30, 35],
      danger: [40, -5]
    }
  },

  // Độ ẩm (field2) - Liên tục (%)
  humidity: {
    name: 'Độ ẩm',
    unit: '%',
    fieldKey: 'field2', 
    icon: '💧',
    iconComponent: Droplets,
    dataType: 'percentage',
    primary: 'area',
    secondary: ['line', 'bar'],
    reasoning: 'Độ ẩm (%) hiển thị tốt nhất với Area Chart để thể hiện vùng bao phủ phần trăm. Dễ nhận biết khi độ ẩm vượt ngưỡng an toàn.',
    chartTypes: {
      area: 'Tốt nhất - thể hiện vùng bao phủ % độ ẩm',
      line: 'Tốt cho theo dõi xu hướng độ ẩm',
      bar: 'Phù hợp khi so sánh độ ẩm theo giờ/ngày',
      scatter: 'Tìm mối tương quan với nhiệt độ'
    },
    thresholds: {
      optimal: [40, 60],
      warning: [70, 30],
      danger: [80, 20]
    }
  },

  // CO (field4) - Nồng độ khí (ppm)
  mq7CO: {
    name: 'CO (Carbon Monoxide)',
    unit: 'ppm',
    fieldKey: 'field4',
    icon: '⚠️',
    iconComponent: AlertTriangle,
    dataType: 'concentration',
    primary: 'line',
    secondary: ['bar', 'area'],
    reasoning: 'Nồng độ CO cần theo dõi xu hướng liên tục để phát hiện mức độ nguy hiểm. Line Chart cho phép phát hiện nhanh sự gia tăng CO.',
    chartTypes: {
      line: 'Tốt nhất - phát hiện nhanh xu hướng tăng CO',
      bar: 'So sánh mức CO theo thời điểm cụ thể', 
      area: 'Hiển thị vùng nguy hiểm CO',
      scatter: 'Phân tích phân bố mức độ CO'
    },
    thresholds: {
      optimal: [0, 10],
      warning: [30, 50],
      danger: [100, 200]
    }
  },

  // Dust Sensor (field8) - Chỉ số bụi (μg/m³)
  dust: {
    name: 'Bụi mịn (PM)',
    unit: 'μg/m³',
    fieldKey: 'field8',
    icon: '🌪️', 
    iconComponent: Wind,
    dataType: 'pollution',
    primary: 'line',
    secondary: ['bar', 'area'],
    reasoning: 'Chỉ số bụi mịn theo thời gian để quan sát xu hướng ô nhiễm. Line Chart tốt nhất để theo dõi biến động chất lượng không khí.',
    chartTypes: {
      line: 'Tốt nhất - theo dõi xu hướng ô nhiễm',
      bar: 'So sánh mức bụi theo khu vực/giờ trong ngày',
      area: 'Hiển thị vùng ô nhiễm nguy hiểm',
      scatter: 'Phân tích mối quan hệ với các yếu tố khác'
    },
    thresholds: {
      optimal: [0, 12],
      warning: [35, 55],
      danger: [150, 250]
    }
  },

  // MQ7 Raw (field3) - Giá trị thô sensor
  mq7Raw: {
    name: 'MQ7 Raw Value',
    unit: '',
    fieldKey: 'field3',
    icon: '🔧',
    iconComponent: Settings,
    dataType: 'raw',
    primary: 'bar',
    secondary: ['line', 'scatter'],
    reasoning: 'Giá trị thô từ sensor MQ7. Bar Chart phù hợp cho dữ liệu rời rạc, dễ so sánh các mức đọc sensor.',
    chartTypes: {
      bar: 'Tốt nhất - hiển thị giá trị rời rạc từ sensor',
      line: 'Theo dõi xu hướng thay đổi sensor',
      scatter: 'Phân tích sự phân bố giá trị sensor',
      area: 'Không phù hợp với dữ liệu raw sensor'
    }
  },

  // MQ2 Raw (field5) - Giá trị thô sensor
  mq2Raw: {
    name: 'MQ2 Raw Value', 
    unit: '',
    fieldKey: 'field5',
    icon: '🔧',
    iconComponent: Settings,
    dataType: 'raw',
    primary: 'bar',
    secondary: ['line', 'scatter'],
    reasoning: 'Giá trị thô từ sensor MQ2. Bar Chart phù hợp cho dữ liệu rời rạc từ sensor khí.',
    chartTypes: {
      bar: 'Tốt nhất - hiển thị giá trị rời rạc từ sensor',
      line: 'Theo dõi xu hướng sensor theo thời gian',
      scatter: 'Phân tích mối quan hệ giữa các sensor',
      area: 'Không phù hợp với dữ liệu raw sensor'
    }
  }
};

// Enhanced chart types with better descriptions
const CHART_TYPES = {
  line: { 
    name: 'Line Chart', 
    emoji: '📈', 
    description: 'Biểu đồ đường - Tốt nhất cho dữ liệu liên tục theo thời gian',
    bestFor: 'Theo dõi xu hướng, phát hiện biến thiên',
    ideal: ['continuous', 'concentration', 'pollution']
  },
  area: { 
    name: 'Area Chart', 
    emoji: '📊', 
    description: 'Biểu đồ vùng - Tốt cho dữ liệu phần trăm và ngưỡng',
    bestFor: 'Hiển thị vùng bao phủ, tỷ lệ phần trăm, ngưỡng an toàn',
    ideal: ['percentage', 'pollution', 'concentration']
  },
  bar: { 
    name: 'Bar Chart', 
    emoji: '📊', 
    description: 'Biểu đồ cột - Tốt cho so sánh giá trị rời rạc',
    bestFor: 'So sánh giá trị, dữ liệu rời rạc, phân tích theo thời điểm',
    ideal: ['raw', 'discrete']
  },
  scatter: {
    name: 'Scatter Plot',
    emoji: '🔵',
    description: 'Biểu đồ phân tán - Phát hiện mối tương quan và ngoại lệ',
    bestFor: 'Phân tích tương quan, phát hiện ngoại lệ, phân bố dữ liệu',
    ideal: ['continuous', 'analysis']
  }
};

// Enhanced color palette for better sensor distinction
const SENSOR_COLOR_PALETTE = {
  temp: '#dc2626',      // Red for temperature
  humidity: '#2563eb',  // Blue for humidity  
  mq7CO: '#ea580c',     // Orange for CO (danger)
  dust: '#16a34a',      // Green for dust
  mq7Raw: '#7c3aed',    // Purple for raw sensors
  mq2Raw: '#0891b2',    // Cyan for raw sensors
  lpg: '#be123c',       // Pink for LPG
  smoke: '#374151'      // Gray for smoke
};

const ChartView = ({ 
  data = [], 
  title = "📊 Biểu đồ thông minh theo thời gian",
  showControls = true,
  defaultChartType = 'auto',
  height = 400 
}) => {
  // Enhanced primary sensor detection with field mapping
  const primarySensor = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return 'temp';
    
    const sampleData = data[0];
    if (!sampleData) return 'temp';
    
    // Priority detection based on data availability and importance
    const detectionPriority = [
      { key: 'temp', hasData: sampleData.temp !== undefined && sampleData.temp !== null },
      { key: 'mq7CO', hasData: sampleData.mq7CO !== undefined && sampleData.mq7CO !== null },
      { key: 'humidity', hasData: sampleData.humidity !== undefined && sampleData.humidity !== null },
      { key: 'dust', hasData: sampleData.dust !== undefined && sampleData.dust !== null },
      { key: 'mq7Raw', hasData: sampleData.mq7Raw !== undefined && sampleData.mq7Raw !== null },
      { key: 'mq2Raw', hasData: sampleData.mq2Raw !== undefined && sampleData.mq2Raw !== null }
    ];
    
    // Return first sensor with data
    const activeSensor = detectionPriority.find(sensor => sensor.hasData);
    return activeSensor ? activeSensor.key : 'temp';
  }, [data]);

  // Smart chart type selection based on sensor
  const smartChartType = useMemo(() => {
    if (defaultChartType !== 'auto') return defaultChartType;
    
    const recommendation = SENSOR_CHART_RECOMMENDATIONS[primarySensor];
    return recommendation ? recommendation.primary : 'line';
  }, [defaultChartType, primarySensor]);

  const [chartType, setChartType] = useState(smartChartType);
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
  const [showRecommendations, setShowRecommendations] = useState(true);

  // Enhanced sensor configurations with colors
  const sensorConfigs = useMemo(() => {
    return Object.entries(SENSOR_CHART_RECOMMENDATIONS).map(([key, config]) => ({
      key,
      name: `${config.icon} ${config.name} ${config.unit ? `(${config.unit})` : ''}`,
      color: SENSOR_COLOR_PALETTE[key] || '#6b7280',
      config
    }));
  }, []);

  // Safe data validation
  const safeData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      console.warn('ChartView: Invalid data provided, using empty array');
      return [];
    }
    
    return data.filter(item => item && typeof item === 'object');
  }, [data]);

  const toggleSensor = (sensorKey) => {
    if (!sensorKey || typeof sensorKey !== 'string') return;
    
    setSelectedSensors(prev => ({
      ...prev,
      [sensorKey]: !prev[sensorKey]
    }));
  };

  // Enhanced Smart Recommendations Panel
  const SmartRecommendations = () => {
    const recommendation = SENSOR_CHART_RECOMMENDATIONS[primarySensor];
    if (!recommendation || !showRecommendations) return null;

    const IconComponent = recommendation.iconComponent || Settings;

    return (
      <div style={{
        marginBottom: '20px',
        padding: '20px',
        backgroundColor: '#f0f9ff',
        borderRadius: '16px',
        border: '2px solid #3b82f6',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
        position: 'relative'
      }}>
        {/* Header with close button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              padding: '8px',
              backgroundColor: '#3b82f6',
              borderRadius: '8px',
              color: 'white'
            }}>
              <IconComponent size={20} />
            </div>
            <div>
              <h4 style={{ 
                margin: 0, 
                color: '#1d4ed8', 
                fontSize: '1.1rem',
                fontWeight: '700'
              }}>
                🎯 Đề xuất thông minh cho {recommendation.icon} {recommendation.name}
              </h4>
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '0.85rem',
                color: '#1e40af',
                fontStyle: 'italic'
              }}>
                Loại dữ liệu: {recommendation.dataType} • Đơn vị: {recommendation.unit || 'không có'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowRecommendations(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '1.4rem',
              padding: '4px',
              borderRadius: '4px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            ✕
          </button>
        </div>
        
        {/* Reasoning */}
        <div style={{
          color: '#1e40af',
          fontSize: '0.95rem',
          lineHeight: '1.6',
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: '#eff6ff',
          borderRadius: '8px',
          border: '1px solid #bae6fd'
        }}>
          💡 <strong>Lý do:</strong> {recommendation.reasoning}
        </div>

        {/* Chart recommendations */}
        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '16px'
        }}>
          <span style={{ 
            fontSize: '0.9rem', 
            color: '#374151', 
            fontWeight: '700',
            minWidth: 'fit-content'
          }}>
            📊 Biểu đồ đề xuất:
          </span>
          
          {/* Primary recommendation - highlighted */}
          <button
            onClick={() => setChartType(recommendation.primary)}
            style={{
              padding: '8px 16px',
              fontSize: '0.85rem',
              backgroundColor: chartType === recommendation.primary ? '#3b82f6' : '#e0e7ff',
              color: chartType === recommendation.primary ? 'white' : '#3730a3',
              border: `3px solid ${chartType === recommendation.primary ? '#3b82f6' : '#c7d2fe'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              if (chartType !== recommendation.primary) {
                e.target.style.backgroundColor = '#c7d2fe';
                e.target.style.borderColor = '#3b82f6';
              }
            }}
            onMouseLeave={(e) => {
              if (chartType !== recommendation.primary) {
                e.target.style.backgroundColor = '#e0e7ff';
                e.target.style.borderColor = '#c7d2fe';
              }
            }}
          >
            ⭐ {CHART_TYPES[recommendation.primary]?.emoji} {CHART_TYPES[recommendation.primary]?.name}
            {chartType === recommendation.primary && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#10b981',
                color: 'white',
                fontSize: '0.7rem',
                padding: '2px 6px',
                borderRadius: '12px',
                fontWeight: '700'
              }}>
                ✓
              </span>
            )}
          </button>

          {/* Secondary recommendations */}
          {recommendation.secondary.map(type => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                backgroundColor: chartType === type ? '#10b981' : '#f3f4f6',
                color: chartType === type ? 'white' : '#374151',
                border: `2px solid ${chartType === type ? '#10b981' : '#d1d5db'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: chartType === type ? '600' : '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (chartType !== type) {
                  e.target.style.backgroundColor = '#e5e7eb';
                  e.target.style.borderColor = '#9ca3af';
                }
              }}
              onMouseLeave={(e) => {
                if (chartType !== type) {
                  e.target.style.backgroundColor = '#f3f4f6';
                  e.target.style.borderColor = '#d1d5db';
                }
              }}
            >
              {CHART_TYPES[type]?.emoji} {CHART_TYPES[type]?.name}
            </button>
          ))}
        </div>

        {/* Current chart explanation */}
        <div style={{
          padding: '12px 16px',
          backgroundColor: chartType === recommendation.primary ? '#dcfce7' : '#fef3c7',
          borderRadius: '8px',
          fontSize: '0.85rem',
          color: chartType === recommendation.primary ? '#166534' : '#92400e',
          border: `2px solid ${chartType === recommendation.primary ? '#bbf7d0' : '#fbbf24'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            fontSize: '1.2rem'
          }}>
            {chartType === recommendation.primary ? '✅' : '💡'}
          </div>
          <div>
            <strong>📈 Hiện tại:</strong> {CHART_TYPES[chartType]?.name} - {recommendation.chartTypes[chartType]}
            {chartType === recommendation.primary && (
              <div style={{ marginTop: '4px', fontWeight: '700' }}>
                🎉 Tuyệt vời! Đây là lựa chọn tối ưu cho {recommendation.name}
              </div>
            )}
            {chartType !== recommendation.primary && (
              <div style={{ marginTop: '4px', fontWeight: '600' }}>
                💡 Gợi ý: Thử {CHART_TYPES[recommendation.primary]?.name} để phù hợp hơn với dữ liệu {recommendation.name}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Enhanced tooltip with sensor-specific information
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !Array.isArray(payload) || payload.length === 0) {
      return null;
    }

    return (
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        padding: '16px 20px',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
        minWidth: '200px'
      }}>
        <p style={{ 
          margin: '0 0 12px 0', 
          fontWeight: '700', 
          color: '#1f2937',
          fontSize: '0.95rem',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '8px'
        }}>
          🕐 {label || 'N/A'}
        </p>
        {payload
          .filter(entry => entry && entry.value !== null && entry.value !== undefined)
          .map((entry, index) => {
            const sensorConfig = sensorConfigs.find(s => s.key === entry.dataKey);
            const recommendation = SENSOR_CHART_RECOMMENDATIONS[entry.dataKey];
            
            return (
              <div key={`tooltip-${index}`} style={{ 
                margin: '8px 0',
                padding: '6px 0',
                borderLeft: `4px solid ${entry.color}`,
                paddingLeft: '12px'
              }}>
                <div style={{
                  color: entry.color || '#6b7280',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '2px'
                }}>
                  {recommendation?.icon} {recommendation?.name || entry.name || entry.dataKey}
                </div>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  color: '#1f2937'
                }}>
                  {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
                  {recommendation?.unit && ` ${recommendation.unit}`}
                </div>
              </div>
            );
          })
        }
      </div>
    );
  };

  // Enhanced chart rendering with better styling
  const renderChart = () => {
    if (!safeData || safeData.length === 0) {
      return (
        <div style={{
          width: '100%',
          height: height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
          fontSize: '1.1rem',
          backgroundColor: '#f9fafb',
          border: '3px dashed #d1d5db',
          borderRadius: '16px',
          gap: '16px'
        }}>
          <AlertCircle size={56} color="#6b7280" />
          <div style={{ fontSize: '1.3rem', fontWeight: '600' }}>📊 Không có dữ liệu để hiển thị</div>
          <div style={{ fontSize: '1rem', textAlign: 'center', color: '#9ca3af', maxWidth: '400px' }}>
            Vui lòng kiểm tra kết nối dữ liệu hoặc chọn khoảng thời gian khác
          </div>
        </div>
      );
    }

    const activeLines = sensorConfigs.filter(sensor => 
      sensor && sensor.key && selectedSensors[sensor.key]
    );

    if (activeLines.length === 0) {
      return (
        <div style={{
          width: '100%',
          height: height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
          fontSize: '1.1rem',
          backgroundColor: '#f9fafb',
          border: '3px dashed #d1d5db',
          borderRadius: '16px',
          gap: '16px'
        }}>
          <Settings size={56} color="#6b7280" />
          <div style={{ fontSize: '1.3rem', fontWeight: '600' }}>🎛️ Chọn ít nhất một sensor để hiển thị</div>
          <div style={{ fontSize: '1rem', textAlign: 'center', color: '#9ca3af', maxWidth: '400px' }}>
            Sử dụng các nút sensor bên dưới để chọn dữ liệu hiển thị
          </div>
        </div>
      );
    }

    const commonProps = {
      data: safeData,
      margin: { top: 25, right: 35, left: 25, bottom: 25 }
    };

    const commonElements = [
      showGrid && <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.7} />,
      <XAxis 
        key="xaxis"
        dataKey="time" 
        stroke="#6b7280"
        fontSize={11}
        fontWeight={500}
        tickFormatter={(value) => {
          if (!value || typeof value !== 'string') return '';
          return value.length > 8 ? value.substring(0, 5) : value;
        }}
      />,
      <YAxis 
        key="yaxis" 
        stroke="#6b7280" 
        fontSize={11}
        fontWeight={500}
      />,
      <Tooltip key="tooltip" content={<CustomTooltip />} />,
      showLegend && <Legend key="legend" />
    ].filter(Boolean);

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {commonElements}
            {activeLines.map((sensor) => (
              <Area
                key={`area-${sensor.key}`}
                type="monotone"
                dataKey={sensor.key}
                stackId={sensor.key}
                stroke={sensor.color}
                fill={`${sensor.color}25`}
                strokeWidth={2}
                name={sensor.name}
                dot={{ r: 4, fill: sensor.color, strokeWidth: 2, stroke: 'white' }}
                activeDot={{ r: 6, fill: sensor.color, strokeWidth: 2, stroke: 'white' }}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {commonElements}
            {activeLines.map((sensor) => (
              <Bar
                key={`bar-${sensor.key}`}
                dataKey={sensor.key}
                fill={sensor.color}
                name={sensor.name}
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />
            ))}
          </BarChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            {commonElements}
            {activeLines.map((sensor) => (
              <Scatter
                key={`scatter-${sensor.key}`}
                dataKey={sensor.key}
                fill={sensor.color}
                name={sensor.name}
              />
            ))}
          </ScatterChart>
        );

      case 'line':
      default:
        return (
          <LineChart {...commonProps}>
            {commonElements}
            {activeLines.map((sensor) => (
              <Line
                key={`line-${sensor.key}`}
                type="monotone"
                dataKey={sensor.key}
                stroke={sensor.color}
                strokeWidth={3}
                name={sensor.name}
                dot={{ r: 4, fill: sensor.color, strokeWidth: 2, stroke: 'white' }}
                activeDot={{ r: 7, fill: sensor.color, strokeWidth: 3, stroke: 'white' }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        );
    }
  };

  const containerStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '28px',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e5e7eb',
    margin: '20px 0'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '20px'
  };

  const titleStyle = {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const controlsStyle = {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap'
  };

  const getButtonStyle = (isActive) => ({
    padding: '10px 18px',
    border: `2px solid ${isActive ? '#3b82f6' : '#d1d5db'}`,
    borderRadius: '10px',
    backgroundColor: isActive ? '#3b82f6' : 'white',
    color: isActive ? 'white' : '#374151',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  });

  const sensorControlsStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '20px',
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  };

  const getSensorButtonStyle = (isSelected, color) => ({
    padding: '8px 16px',
    border: `3px solid ${isSelected ? color : '#d1d5db'}`,
    borderRadius: '8px',
    backgroundColor: isSelected ? `${color}15` : 'white',
    color: isSelected ? color : '#6b7280',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: isSelected ? '700' : '500',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  });

  return (
    <div className="chart-container" style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>
          <TrendingUp size={28} />
          {title}
        </h3>
        
        {showControls && (
          <div style={controlsStyle}>
            {Object.entries(CHART_TYPES).map(([type, config]) => (
              <button
                key={type}
                style={getButtonStyle(chartType === type)}
                onClick={() => setChartType(type)}
                onMouseEnter={(e) => {
                  if (chartType !== type) {
                    e.target.style.backgroundColor = '#f3f4f6';
                    e.target.style.borderColor = '#9ca3af';
                  }
                }}
                onMouseLeave={(e) => {
                  if (chartType !== type) {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.borderColor = '#d1d5db';
                  }
                }}
              >
                {config.emoji} {config.name}
              </button>
            ))}
            
            <button
              style={getButtonStyle(showGrid)}
              onClick={() => setShowGrid(!showGrid)}
            >
              🔲 Grid
            </button>
            
            <button
              style={getButtonStyle(showLegend)}
              onClick={() => setShowLegend(!showLegend)}
            >
              📋 Legend
            </button>
          </div>
        )}
      </div>

      {/* Smart Recommendations */}
      <SmartRecommendations />

      {/* Enhanced sensor selection controls */}
      {showControls && (
        <div style={sensorControlsStyle}>
          <div style={{ 
            fontSize: '1rem', 
            fontWeight: '700', 
            color: '#374151', 
            marginRight: '16px', 
            display: 'flex', 
            alignItems: 'center',
            minWidth: 'fit-content'
          }}>
            <Settings size={18} style={{ marginRight: '8px' }} />
            🎛️ Chọn sensors:
          </div>
          {sensorConfigs.map((sensor) => (
            <button
              key={sensor.key}
              style={getSensorButtonStyle(selectedSensors[sensor.key], sensor.color)}
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
              {sensor.config.icon} {sensor.config.name}
              {selectedSensors[sensor.key] && (
                <span style={{
                  backgroundColor: sensor.color,
                  color: 'white',
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: '700'
                }}>
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>

      {/* Enhanced footer with detailed information */}
      <div style={{
        marginTop: '20px',
        padding: '16px 20px',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        fontSize: '0.85rem',
        color: '#6b7280',
        lineHeight: '1.6',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
          <div>
            <strong style={{ color: '#374151' }}>📊 Biểu đồ hiện tại:</strong> {CHART_TYPES[chartType]?.description || 'Biểu đồ dữ liệu'}
          </div>
          <div>
            <strong style={{ color: '#374151' }}>🎯 Sensor chính:</strong> {SENSOR_CHART_RECOMMENDATIONS[primarySensor]?.icon} {SENSOR_CHART_RECOMMENDATIONS[primarySensor]?.name}
          </div>
          <div>
            <strong style={{ color: '#374151' }}>📈 Hiển thị:</strong> {Object.values(selectedSensors || {}).filter(Boolean).length} sensors • {safeData.length} điểm dữ liệu
          </div>
          <div>
            <strong style={{ color: '#374151' }}>💡 Phù hợp với:</strong> {CHART_TYPES[chartType]?.bestFor}
          </div>
        </div>
        
        {chartType === SENSOR_CHART_RECOMMENDATIONS[primarySensor]?.primary && (
          <div style={{ 
            marginTop: '12px', 
            padding: '8px 12px',
            backgroundColor: '#dcfce7',
            borderRadius: '6px',
            border: '1px solid #bbf7d0',
            color: '#166534',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ✅ <span>Tuyệt vời! Bạn đang sử dụng biểu đồ tối ưu cho loại dữ liệu này</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartView;