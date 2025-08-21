// src/MultiChannelDashboard.jsx - Dashboard chính với navigation đa kênh  
import React, { useState, useEffect } from 'react';
import ThingSpeakDashboard from './ThingSpeakDashboard';
import SimpleChannelDetail from './SimpleChannelDetail';
import { fetchPrediction } from '../utils/predictService';

const MultiChannelDashboard = () => {
  const [currentView, setCurrentView] = useState('main'); // 'main' hoặc 'detail'
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [sensorData, setSensorData] = useState([]); // optional: nếu bạn load data tại đây
  const [predictedValue, setPredictedValue] = useState(null);

  // Gọi AI dự đoán nếu có dữ liệu
  useEffect(() => {
    if (sensorData.length >= 5) {
      const values = sensorData.map(d => d.value); // d.value = giá trị cảm biến
      fetchPrediction(values).then(setPredictedValue);
    }
  }, [sensorData]);

  const handleSelectChannel = (channelInfo) => {
    console.log('Selected channel:', channelInfo); // Debug log
    setSelectedChannel(channelInfo);
    setCurrentView('detail');
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setSelectedChannel(null);
  };

  return (
    <div>
      {currentView === 'main' && (
        <ThingSpeakDashboard 
          onSelectChannel={handleSelectChannel}
          // Gợi ý: truyền setSensorData xuống để ThingSpeakDashboard cập nhật
          setSensorData={setSensorData} 
          predictedValue={predictedValue} // nếu bạn cần hiển thị trong dashboard
        />
      )}
      
      {currentView === 'detail' && selectedChannel && (
        <SimpleChannelDetail 
          channelInfo={selectedChannel}
          onBack={handleBackToMain}
        />
      )}
    </div>
  );
};

export default MultiChannelDashboard;
