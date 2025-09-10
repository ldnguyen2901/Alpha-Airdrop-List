import { useCallback } from 'react';
import { splitCSV, CSV_HEADERS, TGE_CSV_HEADERS, parsePastedData, filterMainTokensFromRows } from '../utils';
import { readExcelFile, parseExcelData, parseTgeExcelData } from '../utils';
import * as XLSX from 'xlsx';

export const useImportExport = (addMultipleRows, replaceRows) => {
  // Handle paste CSV/TSV data
  const handlePaste = useCallback((text) => {
    try {
      const result = parsePastedData(text);
      
      if (result.success) {
        // Filter out main tokens from pasted data
        const filteredData = filterMainTokensFromRows(result.data);
        addMultipleRows(filteredData);
        return { success: true, count: filteredData.length };
      } else {
        // Nếu có lỗi validation nhưng có partial data, vẫn thêm data hợp lệ
        if (result.partialData && result.partialData.length > 0) {
          // Filter out main tokens from partial data
          const filteredPartialData = filterMainTokensFromRows(result.partialData);
          addMultipleRows(filteredPartialData);
          return { 
            success: true, 
            count: filteredPartialData.length,
            warning: result.error 
          };
        }
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error parsing pasted data:', error);
      return { success: false, error: 'Invalid data format' };
    }
  }, [addMultipleRows]);

  // Export Excel
  const exportExcel = useCallback((rows) => {
    try {
      // Ensure rows is an array
      if (!Array.isArray(rows)) {
        console.warn('rows is not an array in exportExcel:', rows);
        return;
      }
      
      // Filter out main tokens from export data
      const filteredRows = filterMainTokensFromRows(rows);
      
      // Prepare data for Excel
      const excelData = [
        CSV_HEADERS, // Headers row
        ...filteredRows.filter(row => row && row !== null).map(row => [
          row.name || '',
          row.amount || '',
          row.launchAt || '',
          row.apiId || '',
          row.pointPriority || '',
          row.pointFCFS || '',
          row.ath || '', // ✅ Sửa từ highestPrice thành ath để khớp với CSV_HEADERS
          row.atl || '', // ⭐ (thêm mới)
          row.contract || '', // ⭐ (thêm mới)
          row.logo || '',
          row.symbol || '',
          (row.exchanges || []).join(', '), // ⭐ (thêm mới)
          (row.chains || []).join(', '), // ⭐ (thêm mới)
          (row.categories || []).join(', ') // ⭐ (thêm mới)
        ])
      ];

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);

      // Set column widths for better readability
      const columnWidths = [
        { wch: 20 }, // Token
        { wch: 12 }, // Amount
        { wch: 20 }, // Listing time
        { wch: 15 }, // API ID
        { wch: 15 }, // Point (Priority)
        { wch: 15 }, // Point (FCFS)
        { wch: 12 }, // ATH
        { wch: 30 }, // Logo
        { wch: 10 }, // Symbol
        { wch: 25 }, // Exchanges ⭐ (thêm mới)
        { wch: 20 }, // Chains ⭐ (thêm mới)
        { wch: 20 }  // Categories ⭐ (thêm mới)
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Airdrop Data');

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create and download file
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `airdrop-data-${new Date().toISOString().split('T')[0]}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting Excel:', error);
    }
  }, []);

  // Handle Excel import
  const handleImportExcel = useCallback(async (file) => {
    try {
      const excelData = await readExcelFile(file);
      if (!excelData || excelData.length === 0) {
        return { success: false, error: 'No data found in Excel file' };
      }

      const rows = parseExcelData(excelData);
      if (rows && rows.length > 0) {
        // Filter out main tokens from imported data
        const filteredRows = filterMainTokensFromRows(rows);
        addMultipleRows(filteredRows);
        return { success: true, count: filteredRows.length };
      }
      return { success: false, error: 'No valid data found in Excel file' };
    } catch (error) {
      console.error('Error importing Excel:', error);
      return { success: false, error: 'Failed to import Excel file' };
    }
  }, [addMultipleRows]);

  // Create Excel template
  const createExcelTemplate = useCallback(() => {
    try {
      const templateData = [
        ['Token Name (optional)', 'Amount (optional)', 'Listing Date (optional)', 'API ID (required)', 'Point (Priority) (optional)', 'Point (FCFS) (optional)', 'ATH (optional)', 'Logo (optional)', 'Symbol (optional)'],
        ['Bitcoin', '1000', '31/12/2024 15:30', 'bitcoin', '100', '50', '69000', 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', 'BTC'],
        ['', '', '', 'ethereum', '', '', '', '', ''], // Example with only API ID
        ['', '500', '01/01/2025 10:00', 'cardano', '80', '40', '3.1', 'https://assets.coingecko.com/coins/images/975/large/Cardano.png', 'ADA'], // Example without token name
      ];

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(templateData);

      // Set column widths
      const columnWidths = [
        { wch: 20 }, // Token Name
        { wch: 12 }, // Amount
        { wch: 20 }, // Listing Date
        { wch: 15 }, // API ID
        { wch: 15 }, // Point (Priority)
        { wch: 15 }, // Point (FCFS)
        { wch: 12 }, // ATH
        { wch: 30 }, // Logo
        { wch: 10 }, // Symbol
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create and download file
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'airdrop-template.xlsx');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error creating Excel template:', error);
    }
  }, []);

  return {
    handlePaste,
    exportExcel,
    handleImportExcel,
    createExcelTemplate,
  };
};

// TGE-specific import/export functions
export const useTgeImportExport = (addMultipleRows) => {
  // Handle paste CSV/TSV data for TGE
  const handlePaste = useCallback((text) => {
    try {
      const result = parsePastedData(text);
      
      if (result.success) {
        addMultipleRows(result.data);
        return { success: true, count: result.data.length };
      } else {
        // Nếu có lỗi validation nhưng có partial data, vẫn thêm data hợp lệ
        if (result.partialData && result.partialData.length > 0) {
          addMultipleRows(result.partialData);
          return { 
            success: true, 
            count: result.partialData.length,
            warning: result.error 
          };
        }
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error parsing TGE pasted data:', error);
      return { success: false, error: 'Invalid data format' };
    }
  }, [addMultipleRows]);

  // Export TGE data to CSV
  const exportTgeToCSV = useCallback((rows) => {
    if (!rows || rows.length === 0) {
      return;
    }

    const csvData = rows.map(row => ({
      Token: row.symbol || row.name || row.apiId || '',
      'Subscription time': row.launchAt || '',
      'API ID': row.apiId || '',
      'Point': row.point || '',
      'Type': row.type || 'TGE',
      'ATH': row.ath || '',
      'ATL': row.atl || '', // ⭐ (thêm mới)
      'Contract': row.contract || '', // ⭐ (thêm mới)
      'Logo': row.logo || '',
      'Symbol': row.symbol || '',
      'Exchanges': (row.exchanges || []).join(', '), // ⭐ (thêm mới)
      'Chains': (row.chains || []).join(', '), // ⭐ (thêm mới)
      'Categories': (row.categories || []).join(', ') // ⭐ (thêm mới)
    }));

    const csvContent = [
      TGE_CSV_HEADERS.join(','),
      ...csvData.map(row => 
        TGE_CSV_HEADERS.map(header => {
          const value = row[header] || '';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tge-data-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  }, []);

  // Import TGE data from CSV
  const importTgeFromCSV = useCallback((csvText) => {
    try {
      const lines = splitCSV(csvText);
      if (lines.length < 2) {
        throw new Error('Invalid CSV format');
      }

      const headers = lines[0];
      const data = lines.slice(1);

      // Validate headers
      const expectedHeaders = TGE_CSV_HEADERS;
      const isValidHeaders = expectedHeaders.every(header => 
        headers.includes(header)
      );

      if (!isValidHeaders) {
        throw new Error(`Invalid headers. Expected: ${expectedHeaders.join(', ')}`);
      }

      const importedRows = data.map((row, index) => {
        const rowData = {};
        headers.forEach((header, colIndex) => {
          rowData[header] = row[colIndex] || '';
        });

        return {
          name: rowData['Token'] || '',
          launchAt: rowData['Subscription time'] || '',
          apiId: rowData['API ID'] || '',
          point: rowData['Point'] || '',
          type: rowData['Type'] || 'TGE',
          ath: parseFloat(rowData['ATH']) || 0,
          logo: rowData['Logo'] || '',
          symbol: rowData['Symbol'] || '',
          exchanges: rowData['Exchanges'] ? rowData['Exchanges'].split(',').map(s => s.trim()).filter(s => s) : [], // ⭐ (thêm mới)
          chains: rowData['Chains'] ? rowData['Chains'].split(',').map(s => s.trim()).filter(s => s) : [], // ⭐ (thêm mới)
          categories: rowData['Categories'] ? rowData['Categories'].split(',').map(s => s.trim()).filter(s => s) : [] // ⭐ (thêm mới)
        };
      }).filter(row => row.apiId); // Only include rows with API ID

      if (importedRows.length === 0) {
        throw new Error('No valid rows found in CSV');
      }

      addMultipleRows(importedRows);


      return importedRows;
    } catch (error) {
      console.error('TGE CSV import error:', error);
      return null;
    }
  }, [addMultipleRows]);

  // Export TGE data to Excel
  const exportTgeToExcel = useCallback((rows) => {
    try {
      // Ensure rows is an array
      if (!Array.isArray(rows)) {
        console.warn('rows is not an array in exportTgeToExcel:', rows);
        return;
      }
      
      // Prepare data for Excel
      const excelData = [
        TGE_CSV_HEADERS, // Headers row
        ...rows.filter(row => row && row !== null).map(row => [
          row.symbol || row.name || row.apiId || '', // Token
          row.launchAt || '', // Subscription time
          row.apiId || '', // API ID
          row.point || '', // Point
          row.type || 'TGE', // Type
          row.ath || '', // ATH
          row.atl || '', // ATL ⭐ (thêm mới)
          row.contract || '', // Contract ⭐ (thêm mới)
          row.logo || '', // Logo
          row.symbol || '', // Symbol
          (row.exchanges || []).join(', '), // Exchanges ⭐ (thêm mới)
          (row.chains || []).join(', '), // Chains ⭐ (thêm mới)
          (row.categories || []).join(', ') // Categories ⭐ (thêm mới)
        ])
      ];

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);

      // Set column widths for better readability
      const columnWidths = [
        { wch: 20 }, // Token
        { wch: 20 }, // Subscription time
        { wch: 15 }, // API ID
        { wch: 12 }, // Point
        { wch: 12 }, // Type
        { wch: 12 }, // ATH
        { wch: 30 }, // Logo
        { wch: 10 }  // Symbol
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'TGE Data');

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create and download file
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `tge-data-${new Date().toISOString().split('T')[0]}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error exporting TGE Excel:', error);
    }
  }, []);

  // Handle TGE Excel import
  const handleTgeImportExcel = useCallback(async (file) => {
    try {
      console.log('handleTgeImportExcel - file type:', typeof file);
      console.log('handleTgeImportExcel - file constructor:', file?.constructor?.name);
      console.log('handleTgeImportExcel - file instanceof File:', file instanceof File);
      console.log('handleTgeImportExcel - file instanceof Blob:', file instanceof Blob);
      console.log('handleTgeImportExcel - file:', file);
      
      const excelData = await readExcelFile(file);
      if (!excelData || excelData.length === 0) {
        return { success: false, error: 'No data found in Excel file' };
      }

      const rows = parseTgeExcelData(excelData);
      if (rows && rows.length > 0) {
        addMultipleRows(rows);
        return { success: true, count: rows.length };
      }
      return { success: false, error: 'No valid data found in Excel file' };
    } catch (error) {
      console.error('Error importing TGE Excel:', error);
      return { success: false, error: 'Failed to import Excel file' };
    }
  }, [addMultipleRows]);

  // Create TGE Excel template
  const createTgeExcelTemplate = useCallback(() => {
    try {
      const templateData = [
        ['Token Name (optional)', 'Listing Date (optional)', 'API ID (required)', 'Point (optional)', 'Type (optional)', 'Token Price (optional)', 'ATH (optional)', 'Logo (optional)', 'Symbol (optional)'],
        ['Bitcoin', '31/12/2024 15:30', 'bitcoin', '100', 'TGE', '45000', '69000', 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', 'BTC'],
        ['', '', 'ethereum', '', 'Pre-TGE', '', '', '', ''], // Example with only API ID
        ['Cardano', '01/01/2025 10:00', 'cardano', '80', 'TGE', '0.5', '3.1', 'https://assets.coingecko.com/coins/images/975/large/Cardano.png', 'ADA'], // Example without token name
      ];

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(templateData);

      // Set column widths
      const columnWidths = [
        { wch: 20 }, // Token Name
        { wch: 20 }, // Listing Date
        { wch: 15 }, // API ID
        { wch: 12 }, // Point
        { wch: 12 }, // Type
        { wch: 12 }, // Token Price
        { wch: 12 }, // ATH
        { wch: 30 }, // Logo
        { wch: 10 }, // Symbol
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'TGE Template');

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create and download file
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'tge-template.xlsx');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error creating TGE Excel template:', error);
    }
  }, []);

  return {
    handlePaste,
    exportTgeToCSV,
    importTgeFromCSV,
    exportTgeToExcel,
    handleTgeImportExcel,
    createTgeExcelTemplate,
  };
};
