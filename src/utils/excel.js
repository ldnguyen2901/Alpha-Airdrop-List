import * as XLSX from 'xlsx';

export function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    // Validate file parameter
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }
    
    if (!(file instanceof File) && !(file instanceof Blob)) {
      console.error('Invalid file type:', typeof file, file);
      reject(new Error('Invalid file type - expected File or Blob'));
      return;
    }
    
    console.log('readExcelFile - file type:', file.constructor.name);
    console.log('readExcelFile - file size:', file.size);
    console.log('readExcelFile - file name:', file.name || 'unknown');
    
    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Lấy sheet đầu tiên
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Chuyển đổi thành JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1, // Sử dụng header dạng array
          defval: '', // Giá trị mặc định cho ô trống
        });

        resolve(jsonData);
      } catch (error) {
        reject(new Error('Không thể đọc file Excel: ' + error.message));
      }
    };

    reader.onerror = function (error) {
      reject(new Error('Lỗi khi đọc file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

export function parseTgeExcelData(excelData) {
  console.log('parseTgeExcelData - input:', excelData);
  console.log('parseTgeExcelData - input type:', typeof excelData);
  console.log('parseTgeExcelData - input isArray:', Array.isArray(excelData));
  
  if (!excelData || excelData.length === 0) {
    console.log('parseTgeExcelData - returning empty array (no input data)');
    return [];
  }

  const errors = [];
  const validRows = [];

  try {
    // Expected column structure for TGE (8 columns):
    // A: Token Name (optional)
    // B: Listing Date (optional)
    // C: API ID (required)
    // D: Point (optional)
    // E: Token Price (optional)
    // F: ATH (optional)
    // G: Logo (optional)
    // H: Symbol (optional)

    // Check if first row looks like header (contains text like "Token", "API", etc.)
    const firstRow = excelData[0] || [];
    const isFirstRowHeader = firstRow.some(cell => 
      String(cell || '').toLowerCase().includes('token') || 
      String(cell || '').toLowerCase().includes('api') ||
      String(cell || '').toLowerCase().includes('listing') ||
      String(cell || '').toLowerCase().includes('point')
    );

    // Start from row 1 if first row is header, otherwise start from row 0
    const dataRows = isFirstRowHeader ? excelData.slice(1) : excelData;

    // If no data rows after header check, return empty
    if (dataRows.length === 0) {
      console.log('parseTgeExcelData - returning empty array (no data rows)');
      return [];
    }

    dataRows.forEach((row, idx) => {
      try {
        // Skip completely empty rows
        if (!row || row.length === 0 || row.every(cell => !cell || String(cell).trim() === '')) {
          return;
        }

        // Validate số cột
        if (row.length < 1) {
          errors.push(`Row ${idx + (isFirstRowHeader ? 2 : 1)}: Empty row`);
          return;
        }
        
        if (row.length > 8) {
          const extras = row.slice(8).some((v) => String(v || '').trim() !== '');
          if (extras) {
            errors.push(`Row ${idx + (isFirstRowHeader ? 2 : 1)}: Data found in columns beyond H (found ${row.length} columns, max 8 allowed)`);
            return;
          }
        }

        const [
          tokenName = '',      // Column A: Token Name
          listingDate = '',    // Column B: Listing Date
          apiId = '',          // Column C: API ID
          point = '',          // Column D: Point
          tokenPrice = '',     // Column E: Token Price
          ath = '',            // Column F: ATH
          logo = '',           // Column G: Logo
          symbol = '',         // Column H: Symbol
        ] = row;

        // Parse data from correct columns
        let actualToken = String(tokenName || '').trim();
        let actualDate = String(listingDate || '').trim();
        let actualApiId = String(apiId || '').trim();
        let actualPoint = String(point || '').trim();
        let actualSymbol = String(symbol || '').trim();
        let actualLogo = String(logo || '').trim();

        // Only API ID is required, others are optional
        if (!actualApiId) {
          errors.push(`Row ${idx + (isFirstRowHeader ? 2 : 1)}: API ID is required`);
          return;
        }

        // Parse token price
        let parsedPrice = 0;
        if (tokenPrice) {
          const cleanPrice = String(tokenPrice).replace(/[^\d.,]/g, '').replace(',', '.');
          parsedPrice = parseFloat(cleanPrice) || 0;
        }

        // Parse ATH
        let parsedATH = 0;
        if (ath) {
          const cleanATH = String(ath).replace(/[^\d.,]/g, '').replace(',', '.');
          parsedATH = parseFloat(cleanATH) || 0;
        }

        // Parse date
        let listingTime = '';
        if (actualDate) {
          const dateStr = actualDate.trim();
          
          // Excel date number
          if (typeof listingDate === 'number' || /^\d+(\.\d+)?$/.test(dateStr)) {
            try {
              const date = new Date((parseFloat(listingDate) - 25569) * 86400 * 1000);
              if (!isNaN(date.getTime())) {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                listingTime = `${day}/${month}/${year} ${hours}:${minutes}`;
              }
            } catch (e) {
              listingTime = dateStr;
            }
          } else {
            // Try to parse DD/MM/YYYY or DD/MM/YYYY HH:mm formats
            const dateMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?$/);
            if (dateMatch) {
              const [, day, month, year, hours = '00', minutes = '00'] = dateMatch;
              listingTime = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year} ${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
            } else {
              listingTime = dateStr;
            }
          }
        }

        const finalRow = {
          name: actualToken || actualApiId, // Use API ID as name if token name is empty
          launchAt: listingTime,
          apiId: actualApiId,
          point: actualPoint,
          price: parsedPrice,
          ath: parsedATH,
          logo: actualLogo,
          symbol: actualSymbol,
        };

        validRows.push(finalRow);

      } catch (error) {
        errors.push(`Row ${idx + (isFirstRowHeader ? 2 : 1)}: ${error.message}`);
      }
    });

    // Nếu có lỗi, log them nhưng vẫn return validRows
    if (errors.length > 0) {
      console.warn('TGE Excel validation warnings:', errors);
    }

    console.log('parseTgeExcelData - output:', validRows);
    console.log('parseTgeExcelData - output type:', typeof validRows);
    console.log('parseTgeExcelData - output isArray:', Array.isArray(validRows));

    return validRows;
  } catch (error) {
    console.error('parseTgeExcelData - error:', error);
    return [];
  }
}

export function parseExcelData(excelData) {
  if (!excelData || excelData.length === 0) {
    return [];
  }

  const errors = [];
  const validRows = [];

  // Expected column structure (11 columns to match export format):
  // A: Token Name (optional)
  // B: Amount (optional)
  // C: Launch Date (optional)
  // D: API ID (required)
  // E: Point Priority (optional)
  // F: Point FCFS (optional)
  // G: Token Price (optional)
  // H: Reward (optional)
  // I: ATH (optional)
  // J: Logo (optional)
  // K: Symbol (optional)

  // Check if first row looks like header (contains text like "Token", "Amount", etc.)
  const firstRow = excelData[0] || [];
  const isFirstRowHeader = firstRow.some(cell => 
    String(cell || '').toLowerCase().includes('token') || 
    String(cell || '').toLowerCase().includes('amount') ||
    String(cell || '').toLowerCase().includes('api') ||
    String(cell || '').toLowerCase().includes('point')
  );

  // Start from row 1 if first row is header, otherwise start from row 0
  const dataRows = isFirstRowHeader ? excelData.slice(1) : excelData;

  // If no data rows after header check, return empty
  if (dataRows.length === 0) {
    return [];
  }

  dataRows.forEach((row, idx) => {
    try {
      // Skip completely empty rows
      if (!row || row.length === 0 || row.every(cell => !cell || String(cell).trim() === '')) {
        return;
      }

      // Validate số cột
      if (row.length < 1) {
        errors.push(`Row ${idx + (isFirstRowHeader ? 2 : 1)}: Empty row`);
        return;
      }
      
      if (row.length > 11) {
        const extras = row.slice(11).some((v) => String(v || '').trim() !== '');
        if (extras) {
          errors.push(`Row ${idx + (isFirstRowHeader ? 2 : 1)}: Data found in columns beyond K (found ${row.length} columns, max 11 allowed)`);
          return;
        }
      }

      const [
        tokenName = '',      // Column A: Token Name
        amount = '',         // Column B: Amount
        launchDate = '',     // Column C: Launch Date
        apiId = '',          // Column D: API ID
        pointPriority = '',  // Column E: Point Priority
        pointFCFS = '',      // Column F: Point FCFS
        tokenPrice = '',     // Column G: Token Price
        reward = '',         // Column H: Reward
        ath = '',            // Column I: ATH
        logo = '',           // Column J: Logo
        symbol = '',         // Column K: Symbol
      ] = row;

      // Parse data from correct columns
      let actualToken = String(tokenName || '').trim();
      let actualAmount = String(amount || '').trim();
      let actualDate = String(launchDate || '').trim();
      let actualApiId = String(apiId || '').trim();
      let actualSymbol = String(symbol || '').trim();
      let actualLogo = String(logo || '').trim();

      // Only API ID is required, others are optional
      if (!actualApiId) {
        errors.push(`Row ${idx + (isFirstRowHeader ? 2 : 1)}: API ID is required`);
        return;
      }

      // Parse amount
      let parsedAmount = 0;
      if (actualAmount) {
        const cleanAmount = actualAmount.replace(/[^\d.,]/g, '').replace(',', '.');
        parsedAmount = parseFloat(cleanAmount) || 0;
      }

      // Parse token price
      let parsedPrice = 0;
      if (tokenPrice) {
        const cleanPrice = String(tokenPrice).replace(/[^\d.,]/g, '').replace(',', '.');
        parsedPrice = parseFloat(cleanPrice) || 0;
      }

      // Parse reward
      let parsedReward = 0;
      if (reward) {
        const cleanReward = String(reward).replace(/[^\d.,]/g, '').replace(',', '.');
        parsedReward = parseFloat(cleanReward) || 0;
      }

      // Parse ATH
      let parsedATH = 0;
      if (ath) {
        const cleanATH = String(ath).replace(/[^\d.,]/g, '').replace(',', '.');
        parsedATH = parseFloat(cleanATH) || 0;
      }

      // Parse date
      let listingTime = '';
      if (actualDate) {
        const dateStr = actualDate.trim();
        
        // Excel date number
        if (typeof launchDate === 'number' || /^\d+(\.\d+)?$/.test(dateStr)) {
          try {
            const date = new Date((parseFloat(launchDate) - 25569) * 86400 * 1000);
            if (!isNaN(date.getTime())) {
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              listingTime = `${day}/${month}/${year} ${hours}:${minutes}`;
            }
          } catch (e) {
            listingTime = dateStr;
          }
        } else {
          // Try to parse DD/MM/YYYY or DD/MM/YYYY HH:mm formats
          const dateMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?$/);
          if (dateMatch) {
            const [, day, month, year, hours = '00', minutes = '00'] = dateMatch;
            listingTime = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year} ${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
          } else {
            listingTime = dateStr;
          }
        }
      }

      const finalRow = {
        name: actualToken || actualApiId, // Use API ID as name if token name is empty
        amount: parsedAmount,
        launchAt: listingTime,
        apiId: actualApiId,
        pointPriority: String(pointPriority || '').trim(),
        pointFCFS: String(pointFCFS || '').trim(),
        price: parsedPrice,
        reward: parsedReward,
        highestPrice: parsedATH, // Map ATH to highestPrice for backward compatibility
        ath: parsedATH,
        logo: actualLogo,
        symbol: actualSymbol,
      };

      validRows.push(finalRow);

    } catch (error) {
      errors.push(`Row ${idx + (isFirstRowHeader ? 2 : 1)}: ${error.message}`);
    }
  });

  // Nếu có lỗi, throw error với thông tin chi tiết
  if (errors.length > 0) {
    throw new Error(`Excel validation errors:\n${errors.join('\n')}`);
  }

  return validRows;
}
