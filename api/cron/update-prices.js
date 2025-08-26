// Import functions directly to avoid path issues in Vercel
async function fetchCryptoPrices(ids) {
  if (!ids.length) return {};
  
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids.join(","))}&vs_currencies=usd`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    return {};
  }
}

export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    console.log('🔄 Starting background price update...');
    
    // Fetch main crypto prices
    const prices = await fetchCryptoPrices(['bitcoin', 'ethereum', 'binancecoin']);
    
         // Update main prices trong Firestore
     const { initializeApp } = await import('firebase/app');
     const { getFirestore, doc, setDoc, getDoc, updateDoc } = await import('firebase/firestore');
     
     // Initialize Firebase if not already done
     const firebaseConfig = {
       apiKey: process.env.VITE_FIREBASE_API_KEY,
       authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
       projectId: process.env.VITE_FIREBASE_PROJECT_ID,
       storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
       messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
       appId: process.env.VITE_FIREBASE_APP_ID
     };
     
     const app = initializeApp(firebaseConfig);
     const db = getFirestore(app);
    
    await setDoc(doc(db, 'system', 'prices'), {
      btcPrice: prices.bitcoin?.usd || 0,
      ethPrice: prices.ethereum?.usd || 0,
      bnbPrice: prices.binancecoin?.usd || 0,
      lastUpdated: new Date()
    });
    
         // Fetch và update token prices từ shared workspace
     const workspaceDoc = await getDoc(doc(db, 'workspaces', 'shared-workspace'));
    
    if (workspaceDoc.exists()) {
      const workspaceData = workspaceDoc.data();
      const rows = workspaceData.rows || [];
      
      const tokenIds = rows
        .map(row => row.apiId)
        .filter(Boolean);
      
      if (tokenIds.length > 0) {
        const tokenPrices = await fetchCryptoPrices(tokenIds);
        
        // Update rows với prices mới
        const updatedRows = rows.map(row => {
          if (row.apiId && tokenPrices[row.apiId]) {
            const newPrice = tokenPrices[row.apiId].usd;
            const newValue = newPrice * (row.amount || 0);
            const highestPrice = Math.max(row.highestPrice || 0, newPrice);
            
            return {
              ...row,
              price: newPrice,
              value: newValue,
              highestPrice: highestPrice,
              lastUpdated: new Date()
            };
          }
          return row;
        });
        
        // Update workspace với data mới
        await updateDoc(doc(db, 'workspaces', 'shared-workspace'), {
          rows: updatedRows,
          lastPriceUpdate: new Date()
        });
        
        console.log(`✅ Updated ${Object.keys(tokenPrices).length} token prices`);
      }
    }
    
    console.log('✅ Background price update completed successfully');
    res.status(200).json({ success: true, message: 'Prices updated' });
  } catch (error) {
    console.error('❌ Background job error:', error);
    res.status(500).json({ error: error.message });
  }
}
