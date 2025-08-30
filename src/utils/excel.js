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
        console.error('Error reading Excel file:', error);
        reject(new Error('Không thể đọc file Excel: ' + error.message));
      }
    };

    reader.onerror = function (error) {
      console.error('FileReader error:', error);
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

  // Expected column structure:
  // A: Token Name (optional)
  // B: Amount (optional)
  // C: Launch Date (optional)
  // D: API ID (required)
  // E: Point Priority (optional)
  // F: Point FCFS (optional)

  dataRows.forEach((row, idx) => {
    try {
      // Validate số cột
      if (row.length < 1) {
        errors.push(`Row ${idx + 2}: Empty row`);
        return;
      }
      
      if (row.length > 6) {
        const extras = row.slice(6).some((v) => String(v || '').trim() !== '');
        if (extras) {
          errors.push(`Row ${idx + 2}: Data found in columns beyond F (found ${row.length} columns, max 6 allowed)`);
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
      ] = row;

      // Parse data from correct columns
      let actualToken = String(tokenName || '').trim();
      let actualAmount = String(amount || '').trim();
      let actualDate = String(launchDate || '').trim();
      let actualApiId = String(apiId || '').trim();

      // Only API ID is required, others are optional
      if (!actualApiId) {
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

      validRows.push({
        name: actualToken || actualApiId, // Use API ID as name if token name is empty
        amount: parsedAmount,
        launchAt: listingTime,
        apiId: actualApiId,
        pointPriority: String(pointPriority || '').trim(),
        pointFCFS: String(pointFCFS || '').trim(),
        contractAddress: '', // Will be fetched from API later
        price: 0,
        reward: 0,
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
