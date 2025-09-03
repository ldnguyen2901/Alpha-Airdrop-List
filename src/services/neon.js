import { neon } from '@neondatabase/serverless';

// Neon configuration with warning disabled
const sql = neon(import.meta.env.VITE_NEON_DATABASE_URL, {
  disableWarningInBrowsers: true
});

// Workspace IDs
export const SHARED_WORKSPACE_ID = 'shared-workspace';
export const STATSCARD_WORKSPACE_ID = 'statscard-prices';

// Helper function to remove undefined values from objects
const removeUndefinedValues = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedValues(item));
  }
  if (obj && typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedValues(value);
      }
    }
    return cleaned;
  }
  return obj;
};

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Create workspaces table
    await sql`
      CREATE TABLE IF NOT EXISTS workspaces (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_updated_by VARCHAR(255)
      )
    `;
    
    // Create token_logos table
    await sql`
      CREATE TABLE IF NOT EXISTS token_logos (
        token_id VARCHAR(255) PRIMARY KEY,
        logo TEXT,
        symbol VARCHAR(50),
        name VARCHAR(255),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create statscard_prices table
    await sql`
      CREATE TABLE IF NOT EXISTS statscard_prices (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('Neon database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing Neon database:', error);
    throw error;
  }
}

// Save workspace data
export async function saveWorkspaceData(workspaceId, rows) {
  try {
    const targetWorkspaceId = SHARED_WORKSPACE_ID;
    const cleanedRows = removeUndefinedValues(rows);
    
    // Skip save if no data
    if (!cleanedRows || cleanedRows.length === 0) {
      console.log('Skipping save to Neon - no data to save');
      return;
    }
    
    // Upsert workspace data
    const result = await sql`
      INSERT INTO workspaces (id, data, updated_at, last_updated_by) 
      VALUES (${targetWorkspaceId}, ${JSON.stringify(cleanedRows)}, CURRENT_TIMESTAMP, ${workspaceId || 'anonymous'})
      ON CONFLICT (id) DO UPDATE SET 
        data = EXCLUDED.data,
        updated_at = EXCLUDED.updated_at,
        last_updated_by = EXCLUDED.last_updated_by
    `;
    
    console.log('Saved data to Neon:', cleanedRows.length, 'rows');
    return result;
  } catch (error) {
    console.error('Error saving workspace data to Neon:', error);
    // Don't throw error to prevent app crash
    return null;
  }
}

// Load workspace data once
export async function loadWorkspaceDataOnce(workspaceId) {
  try {
    const targetWorkspaceId = SHARED_WORKSPACE_ID;
    
    const result = await sql`
      SELECT data FROM workspaces WHERE id = ${targetWorkspaceId}
    `;
    
    if (result.length > 0) {
      const data = result[0].data;
      return Array.isArray(data) ? data : [];
    }
    
    return [];
  } catch (error) {
    console.error('Error loading workspace data from Neon:', error);
    return [];
  }
}

// Subscribe to workspace changes (polling-based for now)
export function subscribeWorkspace(workspaceId, callback) {
  const targetWorkspaceId = SHARED_WORKSPACE_ID;
  let isSubscribed = true;
  let lastDataHash = null; // Thêm hash để detect thay đổi
  
  const pollData = async () => {
    if (!isSubscribed) return;
    
    try {
      const data = await loadWorkspaceDataOnce(targetWorkspaceId);
      
      // CHỈ callback khi data thực sự thay đổi
      const currentHash = JSON.stringify(data);
      if (currentHash !== lastDataHash) {
        lastDataHash = currentHash;
        callback(data);
        console.log('🔄 Data changed, triggering update from Neon');
      } else {
        console.log('✅ No data change detected, skipping update');
      }
    } catch (error) {
      console.error('Error polling workspace data from Neon:', error);
    }
  };
  
  // Initial load
  pollData();
  
  // Tăng polling interval lên 30 giây thay vì 5 giây để tiết kiệm tài nguyên
  const interval = setInterval(pollData, 30000);
  
  // Return unsubscribe function
  return () => {
    isSubscribed = false;
    clearInterval(interval);
  };
}

// Save token logo to database
export async function saveTokenLogoToDatabase(tokenId, tokenInfo) {
  if (!tokenId || !tokenInfo) return;
  
  try {
    const cleanedTokenInfo = removeUndefinedValues(tokenInfo);
    
    const result = await sql`
      INSERT INTO token_logos (token_id, logo, symbol, name, updated_at) 
      VALUES (${tokenId}, ${cleanedTokenInfo.logo || ''}, ${cleanedTokenInfo.symbol || ''}, ${cleanedTokenInfo.name || ''}, CURRENT_TIMESTAMP)
      ON CONFLICT (token_id) DO UPDATE SET 
        logo = EXCLUDED.logo,
        symbol = EXCLUDED.symbol,
        name = EXCLUDED.name,
        updated_at = EXCLUDED.updated_at
    `;
    
    return result;
  } catch (error) {
    console.error('Error saving token logo to Neon:', error);
  }
}

// Load token logo from database
export async function loadTokenLogoFromDatabase(tokenId) {
  try {
    const result = await sql`
      SELECT logo, symbol, name FROM token_logos WHERE token_id = ${tokenId}
    `;
    
    if (result.length > 0) {
      return result[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error loading token logo from Neon:', error);
    return null;
  }
}

// Statscard prices management functions
export async function saveStatscardPrices(prices) {
  try {
    const cleanedPrices = removeUndefinedValues(prices);
    
    const result = await sql`
      INSERT INTO statscard_prices (id, data, updated_at) 
      VALUES (${STATSCARD_WORKSPACE_ID}, ${JSON.stringify(cleanedPrices)}, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET 
        data = EXCLUDED.data,
        updated_at = EXCLUDED.updated_at
    `;
    
    return result;
  } catch (error) {
    console.error('Error saving statscard prices to Neon:', error);
    throw error;
  }
}

export async function loadStatscardPrices() {
  try {
    const result = await sql`
      SELECT data FROM statscard_prices WHERE id = ${STATSCARD_WORKSPACE_ID}
    `;
    
    if (result.length > 0) {
      const data = result[0].data;
      return Array.isArray(data) ? data : [];
    }
    
    return [];
  } catch (error) {
    console.error('Error loading statscard prices from Neon:', error);
    return [];
  }
}

export function subscribeStatscardPrices(callback) {
  let isSubscribed = true;
  
  const pollData = async () => {
    if (!isSubscribed) return;
    
    try {
      const data = await loadStatscardPrices();
      callback(data);
    } catch (error) {
      console.error('Error polling statscard prices from Neon:', error);
    }
  };
  
  // Initial load
  pollData();
  
  // Poll every 5 seconds
  const interval = setInterval(pollData, 5000);
  
  // Return unsubscribe function
  return () => {
    isSubscribed = false;
    clearInterval(interval);
  };
}

// Clear workspace data (keep only user data, not statscard data)
export async function clearWorkspaceData() {
  try {
    const result = await sql`
      DELETE FROM workspaces WHERE id = ${SHARED_WORKSPACE_ID}
    `;
    
    console.log('Cleared workspace data from Neon');
    return result;
  } catch (error) {
    console.error('Error clearing workspace data from Neon:', error);
    return null;
  }
}

// Get database stats
export async function getDatabaseStats() {
  try {
    const workspaceCount = await sql`SELECT COUNT(*) as count FROM workspaces`;
    const tokenLogosCount = await sql`SELECT COUNT(*) as count FROM token_logos`;
    const statscardCount = await sql`SELECT COUNT(*) as count FROM statscard_prices`;
    
    return {
      workspaces: workspaceCount[0]?.count || 0,
      tokenLogos: tokenLogosCount[0]?.count || 0,
      statscardPrices: statscardCount[0]?.count || 0
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return { workspaces: 0, tokenLogos: 0, statscardPrices: 0 };
  }
}
