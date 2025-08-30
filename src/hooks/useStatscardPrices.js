import { useCallback, useEffect, useRef } from 'react';
import { 
  saveStatscardPrices, 
  loadStatscardPrices, 
  subscribeStatscardPrices,
  STATSCARD_WORKSPACE_ID 
} from '../services/firebase';

// Default statscard tokens data (simplified)
const DEFAULT_STATSCARD_TOKENS = [
  {
    apiId: 'bitcoin',
    symbol: 'BTC',
    logo: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    current_price: 45000
  },
  {
    apiId: 'ethereum',
    symbol: 'ETH',
    logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    current_price: 3000
  },
  {
    apiId: 'binancecoin',
    symbol: 'BNB',
    logo: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
    current_price: 300
  }
];

export const useStatscardPrices = (setBtcPrice, setEthPrice, setBnbPrice, updateStatscardPrices, setTokenLogos) => {
  const unsubRef = useRef(null);

  // Initialize statscard prices
  const initializeStatscardPrices = useCallback(async () => {
    try {
      console.log('Initializing statscard prices...');
      
      // Load existing data from Firebase
      const existingData = await loadStatscardPrices();
      
      if (existingData && Array.isArray(existingData) && existingData.length > 0) {
        console.log('Found existing statscard prices:', existingData.length, 'tokens');
        
        // Update prices and logos from existing data
        const newTokenLogos = {};
        existingData.forEach(token => {
          if (token.apiId === 'bitcoin' && token.current_price) {
            setBtcPrice(token.current_price);
            newTokenLogos.bitcoin = {
              logo: token.logo || token.image,
              symbol: token.symbol,
              name: token.name
            };
          } else if (token.apiId === 'ethereum' && token.current_price) {
            setEthPrice(token.current_price);
            newTokenLogos.ethereum = {
              logo: token.logo || token.image,
              symbol: token.symbol,
              name: token.name
            };
          } else if (token.apiId === 'binancecoin' && token.current_price) {
            setBnbPrice(token.current_price);
            newTokenLogos.binancecoin = {
              logo: token.logo || token.image,
              symbol: token.symbol,
              name: token.name
            };
          }
        });
        
        // Update tokenLogos state
        if (setTokenLogos) {
          setTokenLogos(newTokenLogos);
        }
      } else {
        console.log('No existing statscard prices found, saving default data...');
        // Save default data to Firebase
        await saveStatscardPrices(DEFAULT_STATSCARD_TOKENS);
        
        // Set default prices
        setBtcPrice(45000);
        setEthPrice(3000);
        setBnbPrice(300);
        
        // Set default tokenLogos
        if (setTokenLogos) {
          setTokenLogos({
            bitcoin: {
              logo: DEFAULT_STATSCARD_TOKENS[0].logo,
              symbol: DEFAULT_STATSCARD_TOKENS[0].symbol,
              name: 'Bitcoin'
            },
            ethereum: {
              logo: DEFAULT_STATSCARD_TOKENS[1].logo,
              symbol: DEFAULT_STATSCARD_TOKENS[1].symbol,
              name: 'Ethereum'
            },
            binancecoin: {
              logo: DEFAULT_STATSCARD_TOKENS[2].logo,
              symbol: DEFAULT_STATSCARD_TOKENS[2].symbol,
              name: 'BNB'
            }
          });
        }
      }
      
      // Subscribe to real-time updates
      const unsubscribe = subscribeStatscardPrices((data) => {
        if (data && Array.isArray(data)) {
          console.log('Statscard prices updated:', data.length, 'tokens');
          
          // Update prices and logos from real-time data
          const newTokenLogos = {};
          data.forEach(token => {
            if (token.apiId === 'bitcoin' && token.current_price) {
              setBtcPrice(token.current_price);
              newTokenLogos.bitcoin = {
                logo: token.logo || token.image,
                symbol: token.symbol,
                name: token.name
              };
            } else if (token.apiId === 'ethereum' && token.current_price) {
              setEthPrice(token.current_price);
              newTokenLogos.ethereum = {
                logo: token.logo || token.image,
                symbol: token.symbol,
                name: token.name
              };
            } else if (token.apiId === 'binancecoin' && token.current_price) {
              setBnbPrice(token.current_price);
              newTokenLogos.binancecoin = {
                logo: token.logo || token.image,
                symbol: token.symbol,
                name: token.name
              };
            }
          });
          
          // Update tokenLogos state
          if (setTokenLogos) {
            setTokenLogos(newTokenLogos);
          }
        }
      });
      
      unsubRef.current = unsubscribe;
      
    } catch (error) {
      console.error('Error initializing statscard prices:', error);
      
      // Set default prices on error
      setBtcPrice(45000);
      setEthPrice(3000);
      setBnbPrice(300);
    }
  }, [setBtcPrice, setEthPrice, setBnbPrice, setTokenLogos]);

  // Update statscard prices with new data
  const updateStatscardPricesWithNewData = useCallback(async (newPrices) => {
    try {
      await saveStatscardPrices(newPrices);
      console.log('Statscard prices updated successfully');
    } catch (error) {
      console.error('Error updating statscard prices:', error);
    }
  }, []);

  // Update statscard prices from API data
  const updateStatscardPricesFromAPI = useCallback(async (apiPrices) => {
    try {
      const updatedStatscardData = DEFAULT_STATSCARD_TOKENS.map(token => ({
        ...token,
        current_price: apiPrices[token.apiId]?.usd || token.current_price
      }));
      
      await saveStatscardPrices(updatedStatscardData);
      console.log('Statscard prices updated from API successfully');
    } catch (error) {
      console.error('Error updating statscard prices from API:', error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
      }
    };
  }, []);

  return {
    initializeStatscardPrices,
    updateStatscardPricesWithNewData,
    updateStatscardPricesFromAPI,
    DEFAULT_STATSCARD_TOKENS
  };
};
