// Centralized error handling utility
export const handleError = (error, context = 'Unknown operation') => {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  
  // Log error with context
  console.error(`Error in ${context}:`, error);
  
  // Return standardized error object
  return {
    success: false,
    error: errorMessage,
    context,
    timestamp: new Date().toISOString()
  };
};

// Neon specific error handler
export const handleNeonError = (error, operation = 'Neon operation') => {
  if (error?.code === 'permission-denied') {
    return handleError(error, `${operation} - Permission denied`);
  }
  if (error?.code === 'unavailable') {
    return handleError(error, `${operation} - Service unavailable`);
  }
  if (error?.code === 'connection-error') {
    return handleError(error, `${operation} - Connection error`);
  }
  return handleError(error, operation);
};

// API specific error handler
export const handleApiError = (error, endpoint = 'API endpoint') => {
  if (error?.status === 429) {
    return handleError(error, `${endpoint} - Rate limit exceeded`);
  }
  if (error?.status >= 500) {
    return handleError(error, `${endpoint} - Server error`);
  }
  return handleError(error, endpoint);
};

// Validation error handler
export const handleValidationError = (errors, formName = 'Form') => {
  return {
    success: false,
    errors,
    context: `${formName} validation failed`,
    timestamp: new Date().toISOString()
  };
};
