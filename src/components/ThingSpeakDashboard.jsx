// src/ThingSpeakDashboard.jsx - Dashboard tổng hợp KHÔNG có biểu đồ
import React, { useEffect, useState, useMemo } from 'react';
import { Activity, RefreshCw, AlertTriangle, Calendar, TrendingUp } from 'lucide-react';

// Import components  
import SensorHeatmap from './SensorHeatmap';
import AlertPanel from './AlertPanel';
import HistoricalComparison from '../components/HistoricalComparison';
import TrendAnalysis from '../components/TrendAnalysis';
import ChannelSelector from './ChannelSelector';

// Import utilities và configs
import { SENSOR_CONFIG, API_ENDPOINTS } from '../utils/sensorConfig';
import { getValueColorAndStatus } from '../utils/thresholds';
import { fetchPrediction } from '../utils/predictService';
import '../styles/dashboard.css';

const ThingSpeakDashboard = ({ onSelectChannel }) => {
  const [data, setData] = useState({feeds: []});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('heatmap');
  const [selectedSensor, setSelectedSensor] = useState('field1');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [predictedValues, setPredictedValues] = useState([]);
  const [showPrediction, setShowPrediction] = useState(false);
  const [timeBefore, setTimeBefore] = useState(1)

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const promises = API_ENDPOINTS.map(async ({ channel, apiKey }) => {
        try {
          const endDate = new Date(new Date().getTime() - timeBefore * 60 * 1000);
          const startDate = new Date(endDate.getTime() + 1 * 60 * 1000);

          const response = await fetch(
            `https://api.thingspeak.com/channels/${channel}/feeds.json?api_key=${apiKey}&results=1&date=${startDate.toISOString()}&end=${endDate.toISOString()}`
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          return {
            channelId: channel,
            apiKey: apiKey,
            channelInfo: data.channel || {},
            latestFeed: data.feeds?.[0] || null,
            feeds: data.feeds || [],
            hasData: !!(data.feeds && data.feeds.length > 0),
            error: null
          };
        } catch (error) {
          console.warn(`Failed to fetch data from channel ${channel}:`, error);
          return {
            channelId: channel,
            apiKey: apiKey,
            channelInfo: {},
            latestFeed: null,
            feeds: [],
            hasData: false,
            error: error.message
          };
        }
      });

      const channelResults = await Promise.all(promises);

      const heatmapFeeds = channelResults.map((channelResult) => {
        if (channelResult.latestFeed) {
          return {
            ...channelResult.latestFeed,
            channelId: channelResult.channelId,
            channelApiKey: channelResult.apiKey,
            channelName: channelResult.channelInfo?.name || `Channel ${channelResult.channelId}`,
            hasData: true
          };
        } else {
          return {
            entry_id: `no-data-${channelResult.channelId}`,
            created_at: new Date().toISOString(),
            field1: null,
            field2: null,
            field3: null,
            field4: null,
            field5: null,
            field6: null,
            field7: null,
            field8: null,
            channelId: channelResult.channelId,
            channelApiKey: channelResult.apiKey,
            channelName: channelResult.channelInfo?.name || `Channel ${channelResult.channelId}`,
            hasData: false,
            error: channelResult.error
          };
        }
      });

      const combinedData = {
        channel: {
          id: 'combined',
          name: 'Bản đồ nhiệt từng kênh riêng biệt',
          description: `25 ô tương ứng 25 kênh API`
        },
        feeds: heatmapFeeds,
        channelList: channelResults,
        stats: {
          totalChannels: channelResults.length,
          channelsWithData: channelResults.filter(c => c.hasData).length,
          channelsWithoutData: channelResults.filter(c => !c.hasData).length
        }
      };

      setData(combinedData);
      setLastUpdate(new Date());

      const prediction = await fetchPrediction(selectedSensor);
      setPredictedValues(prediction || []);

    } catch (err) {
      setError('Lỗi không mong muốn khi tải dữ liệu từ ThingSpeak API');
      console.error('Unexpected API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedSensor, timeBefore]);

  const analysis = useMemo(() => {
    if (!data || !data.feeds || data.feeds.length === 0) return null;

    const alerts = [];
    data.feeds.forEach(feed => {
      if (!feed.hasData) return;

      Object.keys(SENSOR_CONFIG).forEach(fieldKey => {
        const config = SENSOR_CONFIG[fieldKey];
        const value = parseFloat(feed[fieldKey]);

        if (!isNaN(value) && value > 0) {
          const { alertLevels } = config;

          if (alertLevels && value >= alertLevels.danger) {
            alerts.push({
              sensor: config.name,
              message: `Kênh ${feed.channelId}: ${value.toFixed(2)}${config.unit} vượt ngưỡng nguy hiểm (>${alertLevels.danger})`,
              level: 'critical',
              timestamp: feed.created_at
            });
          } else if (alertLevels && value >= alertLevels.warning) {
            alerts.push({
              sensor: config.name,
              message: `Kênh ${feed.channelId}: ${value.toFixed(2)}${config.unit} ở mức cảnh báo (${alertLevels.warning}-${alertLevels.danger})`,
              level: 'warning',
              timestamp: feed.created_at
            });
          } else if (alertLevels && value >= alertLevels.caution) {
            alerts.push({
              sensor: config.name,
              message: `Kênh ${feed.channelId}: ${value.toFixed(2)}${config.unit} cần chú ý (${alertLevels.caution}-${alertLevels.warning})`,
              level: 'caution',
              timestamp: feed.created_at
            });
          }
        }
      });
    });

    return { alerts };
  }, [data]);

  const handleChannelClick = (channelInfo) => {
    if (onSelectChannel) {
      onSelectChannel(channelInfo);
    }
  };

  const realHeatmapData = data?.feeds.map(f => ({
    value: f[selectedSensor],
    hasData: f.hasData,
    channelId: f.channelId,
    error: f.error,
    time: new Date(f.created_at).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      // timeZone: 'UTC'
    })
  })) || [];

  const predictedHeatmapData = predictedValues?.feeds?.map(f => ({
    value: f[selectedSensor],
    hasData: f.hasData,
    channelId: f.channelId,
    error: f.error,
    time: new Date(f.created_at).toLocaleTimeString('vi-VN',
      {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'

      })
  })) || [];

  if (error) {
    return (
      <div className="error-container">
        <AlertTriangle size={32} />
        <p>{error}</p>
        <button onClick={fetchData} className="control-btn">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">🗺️ ThingSpeak Dashboard tổng hợp</h1>

          <div className="dashboard-controls">
            <button onClick={() => setViewMode('heatmap')} className={`control-btn ${viewMode === 'heatmap' ? 'active' : ''}`}>
              🗺️ Bản đồ nhiệt
            </button>
            <button onClick={() => setViewMode('historical')} className={`control-btn ${viewMode === 'historical' ? 'active' : ''}`}>
              <Calendar size={16} /> So sánh lịch sử
            </button>
            <button onClick={() => setViewMode('trend')} className={`control-btn ${viewMode === 'trend' ? 'active' : ''}`}>
              <TrendingUp size={16} /> Xu hướng
            </button>
            <button onClick={fetchData} disabled={loading} className="control-btn refresh">
              <RefreshCw size={16} className={loading ? 'loading-spinner' : ''} /> Làm mới
            </button>
            <ChannelSelector channels={data?.channelList || []} onSelectChannel={handleChannelClick} />
          </div>
        </div>

        {analysis && analysis.alerts.length > 0 && (
          <AlertPanel alerts={analysis.alerts} />
        )}

        {viewMode === 'heatmap' && (
          <>
            <div className="sensor-tabs">
              {Object.keys(SENSOR_CONFIG).map(fieldKey => {
                const config = SENSOR_CONFIG[fieldKey];
                const hasData = data.feeds.some(f => f[fieldKey] && parseFloat(f[fieldKey]) > 0);

                return (
                  <button
                    key={fieldKey}
                    onClick={() => setSelectedSensor(fieldKey)}
                    className={`sensor-tab ${selectedSensor === fieldKey ? 'active' : ''}`}
                    style={{ display: hasData ? 'flex' : 'none' }}
                  >
                    {config.emoji} {config.name}
                  </button>
                );
              })}

              {
                !showPrediction && (
                  <select
                    className="control-btn"
                    value={timeBefore}
                    onChange={(e) => setTimeBefore(e.target.value)}
                    style={{
                      width: '200px',
                    }}
                  >
                    <option value="1">1 phut truoc</option>
                    <option value="2">2 phut truoc</option>
                    <option value="3">3 phut truoc</option>
                    <option value="4">4 phut truoc</option>
                    <option value="5">5 phut truoc</option>
                  </select>
                )
              }




              <button onClick={() => setShowPrediction(p => !p)} className="control-btn">
                {showPrediction ? '👁️ Xem dữ liệu thực' : '🔮 Xem dự đoán AI'}
              </button>
            </div>

            <SensorHeatmap
              title={showPrediction ? `🔮 Dự đoán - ${SENSOR_CONFIG[selectedSensor].name}` : `${SENSOR_CONFIG[selectedSensor].name} - Mỗi ô = 1 kênh riêng biệt`}
              data={showPrediction ? predictedHeatmapData : realHeatmapData}
              unit={SENSOR_CONFIG[selectedSensor].unit}
              thresholdType={SENSOR_CONFIG[selectedSensor].threshold}
            />
          </>
        )}

        {viewMode === 'historical' && <HistoricalComparison currentData={data} />}
        {viewMode === 'trend' && <TrendAnalysis />}

        <div className="footer">
          📊 {data.stats?.totalChannels || 0} kênh ThingSpeak •
          ✅ {data.stats?.channelsWithData || 0} có data •
          ❌ {data.stats?.channelsWithoutData || 0} không data |
          🕒 Cập nhật lần cuối: {lastUpdate?.toLocaleString('vi-VN') || 'Chưa rõ'} |
          🔄 Tự động làm mới mỗi 30 giây
          {viewMode === 'historical' && <span> | 📅 So sánh với dữ liệu lịch sử</span>}
          {viewMode === 'trend' && <span> | 📈 Phân tích xu hướng nhiều ngày</span>}
        </div>
      </div>
    </div>
  );
};

export default ThingSpeakDashboard;
