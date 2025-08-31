import { useCallback } from 'react';
import { forceSyncWithNeon } from '../utils';

export const useForceSync = (setRows, addNotification) => {
  const handleForceSync = useCallback(async () => {
    try {
      console.log('Starting force sync with Neon...');
      
      // Show loading notification
      if (addNotification) {
        addNotification('Đang đồng bộ với Neon database...', 'info');
      }
      
      const result = await forceSyncWithNeon();
      
      if (result.success) {
        // Update the rows state with synced data
        setRows(result.data);
        
        // Show success notification
        if (addNotification) {
          if (result.data.length === 0) {
            addNotification('Đã đồng bộ: Neon database trống', 'success');
          } else {
            addNotification(`Đã đồng bộ: ${result.data.length} tokens từ Neon`, 'success');
          }
        }
        
        console.log('Force sync with Neon completed successfully');
        return true;
      } else {
        // Show error notification
        if (addNotification) {
          addNotification('Lỗi đồng bộ với Neon database', 'error');
        }
        console.error('Force sync with Neon failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error during force sync with Neon:', error);
      
      // Show error notification
      if (addNotification) {
        addNotification('Lỗi đồng bộ với Neon database', 'error');
      }
      return false;
    }
  }, [setRows, addNotification]);

  return { handleForceSync };
};
