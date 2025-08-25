import { useEffect } from 'react';

export const useResponsive = (setIsMobile, setShowHighestPrice) => {
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      
      // Update showHighestPrice based on screen size
      setShowHighestPrice(isMobileView);
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [setIsMobile, setShowHighestPrice]);
};
