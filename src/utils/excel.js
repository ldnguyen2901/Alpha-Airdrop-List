import * as XLSX from 'xlsx';

export function readExcelFile(file) {
  return new Promise((resolve, reject) => {
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

    reader.onerror = function () {
      reject(new Error('Lỗi khi đọc file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

export function parseExcelData(excelData) {
  if (!excelData || excelData.length === 0) {
    return [];
  }

  // Bỏ qua header nếu có
  const dataRows = excelData.slice(1);
  const errors = [];
  const validRows = [];

  dataRows.forEach((row, idx) => {
    try {
      // Validate số cột
      if (row.length < 2) {
        errors.push(`Row ${idx + 2}: Too few columns (${row.length}), minimum 2 required (API ID and optionally Date)`);
        return;
      }
      
      if (row.length > 6) {
        const extras = row.slice(6).some((v) => String(v || '').trim() !== '');
        if (extras) {
          errors.push(`Row ${idx + 2}: Data found in columns beyond F`);
          return;
        }
      }

      const [
        token = '',
        amount = '',
        dateClaim = '',
        fullName = '',
        pointPriority = '',
        pointFCFS = '',
      ] = row;

      // Find API ID - it could be in different columns depending on the format
      let apiId = '';
      let actualToken = '';
      let actualAmount = '';
      let actualDate = '';

             const columns = [token, amount, dateClaim, fullName, pointPriority, pointFCFS];
       
       // Super simple logic for ,ethereum,31/12/2024 format
       if (columns.length >= 3 && !String(token || '').trim() && String(amount || '').trim() && String(dateClaim || '').trim()) {
         // Format: ,API_ID,DATE
         apiId = String(amount || '').trim();
         actualDate = String(dateClaim || '').trim();
       } else if (columns.length >= 2 && String(token || '').trim() && String(amount || '').trim()) {
         // Format: API_ID,DATE
         apiId = String(token || '').trim();
         actualDate = String(amount || '').trim();
       } else if (String(fullName || '').trim()) {
         // Standard format: API ID in column D
         apiId = String(fullName || '').trim();
         actualToken = String(token || '').trim();
         actualAmount = String(amount || '').trim();
         actualDate = String(dateClaim || '').trim();
       } else {
         // Try to find any non-empty, non-date, non-number value
         for (let i = 0; i < columns.length; i++) {
           const col = String(columns[i] || '').trim();
           if (!col) continue;
           
           if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(col)) {
             actualDate = col;
           } else if (!isNaN(parseFloat(col.replace(/[^\d.,]/g, '').replace(',', '.')))) {
             actualAmount = col;
           } else if (!apiId) {
             apiId = col;
           }
         }
       }
       
       actualToken = String(token || '').trim();

      // Only API ID is required, others are optional
      if (!apiId) {
        errors.push(`Row ${idx + 2}: API ID is required`);
        return;
      }

      // Parse amount
      let parsedAmount = 0;
      if (actualAmount) {
        const cleanAmount = actualAmount.replace(/[^\d.,]/g, '').replace(',', '.');
        parsedAmount = parseFloat(cleanAmount) || 0;
      }

      // Parse date
      let listingTime = '';
      if (actualDate) {
        const dateStr = actualDate.trim();
        
        // Excel date number
        if (typeof dateClaim === 'number' || /^\d+(\.\d+)?$/.test(dateStr)) {
          try {
            const date = new Date((parseFloat(dateClaim) - 25569) * 86400 * 1000);
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

      validRows.push({
        name: actualToken || apiId, // Use API ID as name if token name is empty
        amount: parsedAmount,
        launchAt: listingTime,
        apiId: apiId,
        pointPriority: String(pointPriority || '').trim(),
        pointFCFS: String(pointFCFS || '').trim(),
        price: 0,
        value: 0,
        highestPrice: 0,
      });

    } catch (error) {
      errors.push(`Row ${idx + 2}: ${error.message}`);
    }
  });

  // Nếu có lỗi, throw error với thông tin chi tiết
  if (errors.length > 0) {
    throw new Error(`Excel validation errors:\n${errors.join('\n')}`);
  }

  return validRows;
}
