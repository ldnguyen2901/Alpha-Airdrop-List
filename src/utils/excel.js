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

  return dataRows
    .map((row) => {
      const [
        token = '',
        amount = '',
        dateClaim = '',
        fullName = '',
        pointPriority = '',
        pointFCFS = '',
      ] = row;

      // Chuyển đổi Excel date thành ngày tháng
      let listingTime = '';
      if (dateClaim && typeof dateClaim === 'number') {
        try {
          const date = new Date((dateClaim - 25569) * 86400 * 1000);
          // Format: DD/MM/YYYY HH:mm:ss
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          listingTime = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        } catch (e) {
          listingTime = String(dateClaim || '').trim();
        }
      } else {
        listingTime = String(dateClaim || '').trim();
      }

      return {
        name: String(token || '').trim(),
        amount: Number(amount) || 0,
        launchAt: listingTime,
        apiId: String(fullName || '').trim(), // Use Full Name as API ID
        pointPriority: String(pointPriority || '').trim(),
        pointFCFS: String(pointFCFS || '').trim(),
        price: 0, // Will be updated from API
        value: 0, // Will be calculated
        highestPrice: 0, // Will track highest price
      };
    })
    .filter((row) => row.name || row.apiId); // Chỉ lấy dòng có dữ liệu
}
