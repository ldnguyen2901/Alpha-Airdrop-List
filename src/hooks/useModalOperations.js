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
