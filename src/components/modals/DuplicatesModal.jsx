import React from 'react';
import { 
  Close as CloseIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const DuplicatesModal = ({ isOpen, onClose, duplicates }) => {
  if (!isOpen) return null;

  const totalDuplicates = (duplicates?.logos?.length || 0) + 
                         (duplicates?.names?.length || 0) + 
                         (duplicates?.symbols?.length || 0) + 
                         (duplicates?.apiIds?.length || 0);

  const hasDuplicates = totalDuplicates > 0;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[99998]"
        onClick={onClose}
      />
      
             {/* Modal */}
       <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4">
         <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden mx-2 sm:mx-4">
                     {/* Header */}
           <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
             <div className="flex items-center gap-3 flex-1 min-w-0">
               {hasDuplicates ? (
                 <WarningIcon className="text-orange-500 flex-shrink-0" sx={{ fontSize: 28 }} />
               ) : (
                 <CheckCircleIcon className="text-green-500 flex-shrink-0" sx={{ fontSize: 28 }} />
               )}
               <div className="min-w-0 flex-1">
                 <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                   Duplicate Check Results
                 </h2>
                 <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                   Analysis of duplicate tokens in your list
                 </p>
               </div>
             </div>
             <button
               onClick={onClose}
               className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0 ml-4"
             >
               <CloseIcon className="text-gray-500 dark:text-gray-400" />
             </button>
           </div>

                     {/* Content */}
           <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {!hasDuplicates ? (
              <div className="text-center py-8">
                <CheckCircleIcon className="text-green-500 mx-auto mb-4" sx={{ fontSize: 64 }} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Duplicates Found!
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  All tokens in your list have unique data. Great job!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <WarningIcon className="text-orange-500" sx={{ fontSize: 20 }} />
                    <span className="font-semibold text-orange-800 dark:text-orange-200">
                      Found {totalDuplicates} types of duplicates
                    </span>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Review the details below and consider updating duplicate entries.
                  </p>
                </div>

                {/* Duplicate Logos */}
                {duplicates?.logos?.length > 0 && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-red-50 dark:bg-red-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-red-800 dark:text-red-200">
                        Duplicate Logos ({duplicates.logos.length})
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {duplicates.logos.map(([logo, items]) => (
                        <div key={logo} className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <img 
                              src={logo} 
                              alt="Token logo" 
                              className="w-8 h-8 rounded-full"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                Logo URL: {logo.length > 50 ? `${logo.substring(0, 50)}...` : logo}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Used by {items.length} tokens
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    Row {item.index + 1}: {item.name || item.symbol || item.apiId}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    API ID: {item.apiId}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Duplicate Names */}
                {duplicates?.names?.length > 0 && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                        Duplicate Names ({duplicates.names.length})
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {duplicates.names.map(([name, items]) => (
                        <div key={name} className="p-4">
                          <div className="mb-3">
                            <p className="font-medium text-gray-900 dark:text-white">
                              Name: {name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Used by {items.length} tokens
                            </p>
                          </div>
                          <div className="space-y-2">
                            {items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    Row {item.index + 1}: API {item.apiId}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Symbol: {item.symbol}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Duplicate Symbols */}
                {duplicates?.symbols?.length > 0 && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                        Duplicate Symbols ({duplicates.symbols.length})
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {duplicates.symbols.map(([symbol, items]) => (
                        <div key={symbol} className="p-4">
                          <div className="mb-3">
                            <p className="font-medium text-gray-900 dark:text-white">
                              Symbol: {symbol}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Used by {items.length} tokens
                            </p>
                          </div>
                          <div className="space-y-2">
                            {items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    Row {item.index + 1}: {item.name}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    API ID: {item.apiId}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Duplicate API IDs */}
                {duplicates?.apiIds?.length > 0 && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-purple-50 dark:bg-purple-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-purple-800 dark:text-purple-200">
                        Duplicate API IDs ({duplicates.apiIds.length})
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {duplicates.apiIds.map(([apiId, items]) => (
                        <div key={apiId} className="p-4">
                          <div className="mb-3">
                            <p className="font-medium text-gray-900 dark:text-white">
                              API ID: {apiId}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Used by {items.length} tokens
                            </p>
                          </div>
                          <div className="space-y-2">
                            {items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    Row {item.index + 1}: {item.name || item.symbol}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Symbol: {item.symbol}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

                     {/* Footer */}
           <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
             <button
               onClick={onClose}
               className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors flex-shrink-0"
             >
               Close
             </button>
           </div>
        </div>
      </div>
    </>
  );
};

export default DuplicatesModal;
