import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';

const SimpleNotificationTester = () => {
  const { addNotification } = useNotifications();

  const testNotification = (type) => {
    const messages = {
      success: '✅ Thao tác thành công!',
      info: '📈 Giá token đã được cập nhật',
      warning: '⚠️ Token sắp hết thời gian listing',
      error: '❌ Lỗi kết nối API'
    };
    addNotification(messages[type], type);
  };

  return (
    <div className="fixed bottom-4 left-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        🧪 Test Notifications
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => testNotification('success')}
          className="px-3 py-2 text-xs bg-green-100 hover:bg-green-200 text-green-800 rounded transition-colors"
        >
          ✅ Success
        </button>
        <button
          onClick={() => testNotification('info')}
          className="px-3 py-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors"
        >
          📈 Info
        </button>
        <button
          onClick={() => testNotification('warning')}
          className="px-3 py-2 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded transition-colors"
        >
          ⚠️ Warning
        </button>
        <button
          onClick={() => testNotification('error')}
          className="px-3 py-2 text-xs bg-red-100 hover:bg-red-200 text-red-800 rounded transition-colors"
        >
          ❌ Error
        </button>
      </div>
    </div>
  );
};

export default SimpleNotificationTester;
