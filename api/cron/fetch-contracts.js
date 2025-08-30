// Import functions directly to avoid path issues in Vercel
async function fetchContractAddresses(ids) {
  if (!ids.length) return {};
  
  const contracts = {};
  const batchSize = 3;
  
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (id) => {
      try {
        const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          
          let contractAddress = '';
          let platform = '';
          
          if (data.platforms && Object.keys(data.platforms).length > 0) {
            const priorityPlatforms = ['ethereum', 'binance-smart-chain', 'polygon-pos', 'arbitrum-one', 'optimistic-ethereum'];
            
            for (const platformName of priorityPlatforms) {
              if (data.platforms[platformName]) {
                contractAddress = data.platforms[platformName];
                platform = platformName;
                break;
              }
            }
            
            if (!contractAddress) {
              const firstPlatform = Object.keys(data.platforms)[0];
              contractAddress = data.platforms[firstPlatform];
              platform = firstPlatform;
            }
          }
          
          contracts[id] = {
            contractAddress: contractAddress,
            platform: platform
          };
        }
      } catch (error) {
        console.error(`Error fetching contract for ${id}:`, error);
      }
    }));
    
    // Add delay between batches
    if (i + batchSize < ids.length) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  
  return contracts;
}

export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    console.log('🔄 Starting background contract fetch...');
    
         // Get tokens without contract addresses từ shared workspace
     const { initializeApp } = await import('firebase/app');
     const { getFirestore, doc, getDoc, updateDoc } = await import('firebase/firestore');
     
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
    
    const workspaceDoc = await getDoc(doc(db, 'workspaces', 'shared-workspace'));
    
    if (workspaceDoc.exists()) {
      const workspaceData = workspaceDoc.data();
      const rows = workspaceData.rows || [];
      
      const tokensWithoutContract = rows.filter(row => 
        row.apiId && !row.contractAddress
      );
      
      const tokenIds = tokensWithoutContract.map(row => row.apiId);
      
      if (tokenIds.length > 0) {
        const contractData = await fetchContractAddresses(tokenIds);
        
        // Update rows với contract addresses
        const updatedRows = rows.map(row => {
          if (row.apiId && contractData[row.apiId] && contractData[row.apiId].contractAddress) {
            return {
              ...row,
              contractAddress: contractData[row.apiId].contractAddress,
              platform: contractData[row.apiId].platform,
              lastContractFetch: new Date()
            };
          }
          return row;
        });
        
        // Update workspace với data mới
        await updateDoc(doc(db, 'workspaces', 'shared-workspace'), {
          rows: updatedRows,
          lastContractFetch: new Date()
        });
        
        console.log(`✅ Updated ${Object.keys(contractData).length} contract addresses`);
      }
    }
    
    console.log('✅ Background contract fetch completed');
    res.status(200).json({ success: true, message: 'Contracts updated' });
  } catch (error) {
    console.error('❌ Background contract fetch error:', error);
    res.status(500).json({ error: error.message });
  }
}
