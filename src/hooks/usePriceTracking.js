import { useCallback, useRef, useEffect } from 'react';
import { savePriceHistory, loadPriceHistory, saveHighestPrices, loadHighestPrices } from '../utils';

export const usePriceTracking = () => {
  // Store price history for trend analysis
  const priceHistoryRef = useRef(new Map());
  const highestPricesRef = useRef({});
  
  // Configuration for price tracking
  const config = {
    significantChangeThreshold: 5, // 5% change threshold
    historyLength: 24, // Keep last 24 price points
    alertThreshold: 10, // 10% change for alerts
    volatilityThreshold: 3, // 3% for volatility detection
  };

  // Load saved data on initialization
  useEffect(() => {
    try {
      const savedHighestPrices = loadHighestPrices();
      highestPricesRef.current = savedHighestPrices;
  
    } catch (error) {
      console.error('Error loading saved highest prices:', error);
    }
  }, []);

  // Track price changes and update highest price
  const trackPriceChange = useCallback((apiId, currentPrice, previousPrice = 0, highestPrice = 0) => {
    if (!apiId || currentPrice <= 0) return { highestPrice, priceChanged: false, alerts: [] };
    
    const alerts = [];
    let newHighestPrice = highestPrice;
    let priceChanged = false;
    
    // Check against saved highest price
    const savedHighestPrice = highestPricesRef.current[apiId] || 0;
    if (currentPrice > savedHighestPrice) {
      highestPricesRef.current[apiId] = currentPrice;
      saveHighestPrices(highestPricesRef.current);
  
    }
    
    // Update highest price if current price is higher
    if (currentPrice > highestPrice) {
      newHighestPrice = currentPrice;
      priceChanged = true;
      alerts.push({
        type: 'new_high',
        message: `New all-time high: $${currentPrice.toFixed(6)}`,
        price: currentPrice,
        previous: highestPrice
      });
    }
    
    // Calculate price change percentage
    const priceChangePercent = previousPrice > 0 ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0;
    
    // Detect significant price movements
    if (Math.abs(priceChangePercent) >= config.significantChangeThreshold) {
      alerts.push({
        type: 'significant_change',
        message: `Significant ${priceChangePercent > 0 ? 'increase' : 'decrease'}: ${priceChangePercent.toFixed(2)}%`,
        change: priceChangePercent,
        from: previousPrice,
        to: currentPrice
      });
    }
    
    // Detect extreme volatility (for alerting)
    if (Math.abs(priceChangePercent) >= config.alertThreshold) {
      alerts.push({
        type: 'extreme_volatility',
        message: `Extreme volatility: ${priceChangePercent.toFixed(2)}% change`,
        change: priceChangePercent,
        severity: Math.abs(priceChangePercent) >= 20 ? 'high' : 'medium'
      });
    }
    
    // Update price history for trend analysis
    updatePriceHistory(apiId, currentPrice);
    
    return {
      highestPrice: newHighestPrice,
      priceChanged,
      priceChangePercent,
      alerts,
      trend: analyzeTrend(apiId)
    };
  }, []);

  // Update price history for a specific token
  const updatePriceHistory = useCallback((apiId, price) => {
    if (!priceHistoryRef.current.has(apiId)) {
      // Load saved history from localStorage
      const savedHistory = loadPriceHistory(apiId);
      priceHistoryRef.current.set(apiId, savedHistory);
    }
    
    const history = priceHistoryRef.current.get(apiId);
    const timestamp = Date.now();
    
    history.push({ price, timestamp });
    
    // Keep only the last N price points
    if (history.length > config.historyLength) {
      history.shift();
    }
    
    priceHistoryRef.current.set(apiId, history);
    
    // Save to localStorage
    savePriceHistory(apiId, history);
  }, []);

  // Analyze price trend based on recent history
  const analyzeTrend = useCallback((apiId) => {
    const history = priceHistoryRef.current.get(apiId);
    if (!history || history.length < 3) return 'neutral';
    
    const recent = history.slice(-3);
    const prices = recent.map(h => h.price);
    
    // Simple trend analysis
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const changePercent = ((lastPrice - firstPrice) / firstPrice) * 100;
    
    if (changePercent > config.volatilityThreshold) return 'bullish';
    if (changePercent < -config.volatilityThreshold) return 'bearish';
    return 'neutral';
  }, []);

  // Get price statistics for a token
  const getPriceStats = useCallback((apiId) => {
    const history = priceHistoryRef.current.get(apiId);
    if (!history || history.length === 0) return null;
    
    const prices = history.map(h => h.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    return {
      min,
      max,
      average: avg,
      volatility: ((max - min) / avg) * 100,
      dataPoints: history.length
    };
  }, []);

  // Reset price history for a token
  const resetPriceHistory = useCallback((apiId) => {
    priceHistoryRef.current.delete(apiId);
    highestPricesRef.current[apiId] = 0;
    saveHighestPrices(highestPricesRef.current);
  }, []);

  // Get all price alerts for monitoring
  const getPriceAlerts = useCallback((apiId) => {
    const history = priceHistoryRef.current.get(apiId);
    if (!history || history.length < 2) return [];
    
    const alerts = [];
    const recent = history.slice(-2);
    const [prev, current] = recent;
    
    const changePercent = ((current.price - prev.price) / prev.price) * 100;
    
    if (Math.abs(changePercent) >= config.alertThreshold) {
      alerts.push({
        type: 'price_alert',
        message: `Price ${changePercent > 0 ? 'spiked' : 'dropped'} by ${Math.abs(changePercent).toFixed(2)}%`,
        change: changePercent,
        timestamp: current.timestamp
      });
    }
    
    return alerts;
  }, []);

  // Get saved highest price for a token
  const getSavedHighestPrice = useCallback((apiId) => {
    return highestPricesRef.current[apiId] || 0;
  }, []);

  return {
    trackPriceChange,
    updatePriceHistory,
    analyzeTrend,
    getPriceStats,
    resetPriceHistory,
    getPriceAlerts,
    getSavedHighestPrice,
    config
  };
};
