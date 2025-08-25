import { useCallback } from 'react';
import { splitCSV, CSV_HEADERS, readExcelFile, parsePastedData } from '../utils';
import * as XLSX from 'xlsx';

export const useImportExport = (addMultipleRows, replaceRows) => {
  // Handle paste CSV/TSV data
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
      console.error('Error parsing pasted data:', error);
      return { success: false, error: 'Invalid data format' };
    }
  }, [addMultipleRows]);

  // Export Excel
  const exportExcel = useCallback((rows) => {
    try {
      // Prepare data for Excel
      const excelData = [
        CSV_HEADERS, // Headers row
        ...rows.map(row => [
          row.name || '',
          row.amount || '',
          row.launchAt || '',
          row.apiId || '',
          row.pointPriority || '',
          row.pointFCFS || '',
          row.price || '',
          row.value || '',
          row.highestPrice || '',
          row.logo || '',
          row.symbol || ''
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
        { wch: 12 }, // Token Price
        { wch: 12 }, // Reward
        { wch: 12 }, // Highest Price
        { wch: 30 }, // Logo
        { wch: 10 }  // Symbol
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
        replaceRows(rows);
        return { success: true, count: rows.length };
      }
      return { success: false, error: 'No valid data found in Excel file' };
    } catch (error) {
      console.error('Error importing Excel:', error);
      return { success: false, error: error.message || 'Failed to read Excel file' };
    }
  }, [replaceRows]);

  // Create Excel template
  const createExcelTemplate = useCallback(() => {
    try {
      const templateData = [
        ['Token Name (optional)', 'Amount (optional)', 'Listing Date (optional)', 'API ID (required)', 'Point (Priority) (optional)', 'Point (FCFS) (optional)'],
        ['Bitcoin', '1000', '31/12/2024 15:30', 'bitcoin', '100', '50'],
        ['', '', '', 'ethereum', '', ''], // Example with only API ID
        ['', '500', '01/01/2025 10:00', 'cardano', '80', '40'], // Example without token name
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
