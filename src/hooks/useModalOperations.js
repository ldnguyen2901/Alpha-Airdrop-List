import { useCallback } from 'react';

export const useModalOperations = (
  setShowAddModal,
  setAddForm,
  setAddErrors,
  addModalPosition,
  setAddModalPosition
) => {
  // Open add row modal
  const openAddRowModal = useCallback((position = null) => {
    setAddForm({
      name: '',
      amount: '',
      launchAt: '',
      launchDate: '',
      launchTime: '',
      apiId: '',
      pointPriority: '',
      pointFCFS: '',
    });
    setAddErrors({});
    setAddModalPosition(position);
    setShowAddModal(true);
  }, [setShowAddModal, setAddForm, setAddErrors, setAddModalPosition]);

  // Close add row modal
  const closeAddRowModal = useCallback(() => {
    setShowAddModal(false);
    setAddModalPosition(null);
  }, [setShowAddModal, setAddModalPosition]);

  return {
    openAddRowModal,
    closeAddRowModal,
  };
};

// TGE-specific modal operations hook
export const useTgeModalOperations = (state, dataOps, apiOps, importExportOps, duplicateOps) => {
  const handleAddRow = useCallback(() => {
    state.setShowAddModal(true);
  }, [state.setShowAddModal]);

  const handleAddRowWithData = useCallback(async (formData) => {
    return await dataOps.handleAddRowSubmit(formData);
  }, [dataOps]);

  const handlePasteText = useCallback(async (text) => {
    return await importExportOps.handlePaste(text);
  }, [importExportOps]);

  const handleExportExcel = useCallback(() => {
    importExportOps.exportTgeToExcel(state.rows);
  }, [importExportOps, state.rows]);

  const handleImportExcel = useCallback(async (file) => {
    return await importExportOps.handleTgeImportExcel(file);
  }, [importExportOps]);

  const handleRefresh = useCallback(() => {
    apiOps.refreshData();
  }, [apiOps]);

  const handleRefreshToken = useCallback(async (apiId) => {
    return await apiOps.refreshSingleToken(apiId);
  }, [apiOps]);

  const handleCheckDuplicates = useCallback(async () => {
    return await duplicateOps.checkDuplicates();
  }, [duplicateOps]);

  const handleClearAll = useCallback(async () => {
    return await dataOps.clearAllData();
  }, [dataOps]);

  return {
    handleAddRow,
    handleAddRowWithData,
    handlePasteText,
    handleExportExcel,
    handleImportExcel,
    handleRefresh,
    handleRefreshToken,
    handleCheckDuplicates,
    handleClearAll,
  };
};
