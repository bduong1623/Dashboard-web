// src/utils/predictService.js
import fakeData from "./faked_data.json"

export const fetchPrediction = async (sensorValues) => {

  const feeds = fakeData.feeds.map(f => ({ ...f, hasData: true, channelId: fakeData.channel.id }));

  return ({ ...fakeData, feeds })

  try {
    // Gửi POST đến backend để lấy dự đoán cho sensor tương ứng
    const res = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: sensorValues }) // Đảm bảo đúng format yêu cầu của backend
    });

    const data = await res.json();
    if (data && Array.isArray(data.predicted)) {
      // Nếu backend trả về mảng giá trị
      return data.predicted.map(v => ({ value: v, hasData: true }));
    } else if (data && typeof data.predicted === 'number') {
      // Nếu chỉ trả về 1 số, chuyển thành mảng 25 phần tử giống nhau (placeholder)
      return Array(25).fill({ value: data.predicted, hasData: true });
    } else {
      console.warn('Dữ liệu dự đoán không hợp lệ:', data);
      return [];
    }
  } catch (err) {
    // console.error('Prediction error:', err + "");
    return [];
  }
};
