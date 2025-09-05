import { useTgeImportExport as useTgeImportExportFromMain } from './useImportExport';

export const useTgeImportExport = (addMultipleRows, addNotification) => {
  // Use the TGE-specific import/export functions from useImportExport.js
  return useTgeImportExportFromMain(addMultipleRows, addNotification);
};
