import { useCallback } from 'react';
import { forceSyncWithFirebase } from '../utils/cacheManager';

export const useForceSync = (setRows, addNotification) => {
  const handleForceSync = useCallback(async () => {
    try {
      console.log('Starting force sync...');
      
      // Show loading notification
      if (addNotification) {
        addNotification('Đang đồng bộ với database...', 'info');
      }
      
      const result = await forceSyncWithFirebase();
      
      if (result.success) {
        // Update the rows state with synced data
        setRows(result.data);
        
        // Show success notification
        if (addNotification) {
          if (result.data.length === 0) {
            addNotification('Đã đồng bộ: Database trống', 'success');
          } else {
            addNotification(`Đã đồng bộ: ${result.data.length} tokens`, 'success');
          }
        }
        
        console.log('Force sync completed successfully');
        return true;
      } else {
        // Show error notification
        if (addNotification) {
          addNotification('Lỗi đồng bộ với database', 'error');
        }
        console.error('Force sync failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error during force sync:', error);
      
      // Show error notification
      if (addNotification) {
        addNotification('Lỗi đồng bộ với database', 'error');
      }
      return false;
    }
  }, [setRows, addNotification]);

  return { handleForceSync };
};
