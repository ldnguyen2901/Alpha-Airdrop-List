import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [nextId, setNextId] = useState(1);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        const loadedNotifications = parsed.notifications || [];
        
        // Remove any duplicate IDs by keeping only the first occurrence
        const uniqueNotifications = loadedNotifications.filter((notification, index, self) => 
          index === self.findIndex(n => n.id === notification.id)
        );
        
        setNotifications(uniqueNotifications);
        // Ensure nextId is higher than any existing notification ID
        const maxId = Math.max(...uniqueNotifications.map(n => n.id), 0);
        setNextId(maxId + 1);
      } catch (error) {
        console.error('Error parsing notifications from localStorage:', error);
        setNotifications([]);
        setNextId(1);
      }
    } else {
      // Add sample notifications for testing
      const sampleNotifications = [
        {
          id: 1,
          type: 'success',
          message: '🔔 Hệ thống thông báo đã được kích hoạt!',
          time: 'Vừa xong',
          timestamp: Date.now(),
          read: false
        },
        {
          id: 2,
          type: 'info',
          message: '📈 Giá Bitcoin đã tăng 5% trong 24h qua',
          time: '2 phút trước',
          timestamp: Date.now() - 120000,
          read: false
        },
        {
          id: 3,
          type: 'warning',
          message: '⚠️ Token ABC sắp hết thời gian listing (còn 30 phút)',
          time: '5 phút trước',
          timestamp: Date.now() - 300000,
          read: true
        },
        {
          id: 4,
          type: 'error',
          message: '❌ Không thể kết nối đến CoinGecko API',
          time: '10 phút trước',
          timestamp: Date.now() - 600000,
          read: false
        },
        {
          id: 5,
          type: 'success',
          message: '✅ Đã thêm thành công 3 tokens mới',
          time: '15 phút trước',
          timestamp: Date.now() - 900000,
          read: true
        },
        {
          id: 6,
          type: 'info',
          message: '🔄 Dữ liệu đã được đồng bộ với Firebase',
          time: '20 phút trước',
          timestamp: Date.now() - 1200000,
          read: true
        },
        {
          id: 7,
          type: 'warning',
          message: '⚠️ Token XYZ có giá thay đổi đột ngột (+15%)',
          time: '25 phút trước',
          timestamp: Date.now() - 1500000,
          read: false
        },
        {
          id: 8,
          type: 'success',
          message: '📊 Báo cáo thống kê đã được xuất thành công',
          time: '30 phút trước',
          timestamp: Date.now() - 1800000,
          read: true
        }
      ];
      setNotifications(sampleNotifications);
      setNextId(9);
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify({
      notifications,
      nextId
    }));
  }, [notifications, nextId]);

  const addNotification = (message, type = 'info', options = {}) => {
    const now = new Date();
    const timeAgo = getTimeAgo(now);
    
    // Generate unique ID using timestamp + random number to avoid conflicts
    const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
    
    const newNotification = {
      id: uniqueId,
      type,
      message,
      time: timeAgo,
      timestamp: now.getTime(),
      read: false,
      ...options
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep only last 50 notifications
    setNextId(prev => Math.max(prev, uniqueId + 1));

    // Also show toast notification if enabled (disabled by default)
    if (options.showToast === true) {
      const toastOptions = {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        ...options.toastOptions
      };

      switch (type) {
        case 'success':
          toast.success(message, toastOptions);
          break;
        case 'error':
          toast.error(message, toastOptions);
          break;
        case 'warning':
          toast.warning(message, toastOptions);
          break;
        default:
          toast.info(message, toastOptions);
      }
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setNextId(1);
    localStorage.removeItem('notifications');
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Vừa xong';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} phút trước`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} giờ trước`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ngày trước`;
    }
  };

  // Update timestamps every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev => 
        prev.map(notif => ({
          ...notif,
          time: getTimeAgo(new Date(notif.timestamp))
        }))
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const value = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    getUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
