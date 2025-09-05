import { useCallback } from 'react';
import { forceSyncWithNeon } from '../utils';

export const useForceSync = (setRows) => {
  const handleForceSync = useCallback(async () => {
    try {
      console.log('Starting force sync with Neon...');
      
      
      const result = await forceSyncWithNeon();
      
      if (result.success) {
        // Update the rows state with synced data
        setRows(result.data);
        
        
        console.log('Force sync with Neon completed successfully');
        return true;
      } else {
        console.error('Force sync with Neon failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error during force sync with Neon:', error);
      
      return false;
    }
  }, [setRows]);

  return { handleForceSync };
};
