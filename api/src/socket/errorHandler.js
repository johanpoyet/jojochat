const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const retryOperation = async (operation, retries = 0) => {
  try {
    return await operation();
  } catch (error) {
    if (retries < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retries + 1)));
      return retryOperation(operation, retries + 1);
    }
    throw error;
  }
};

const handleSocketError = (socket, error, context) => {
  console.error(`Socket error in ${context}:`, error);

  const errorMessages = {
    'ECONNREFUSED': 'Connection refused. Please try again later.',
    'ETIMEDOUT': 'Connection timed out. Please check your internet connection.',
    'ENOTFOUND': 'Server not found. Please check your connection.',
    'ValidationError': 'Invalid data provided.',
    'CastError': 'Invalid ID format.'
  };

  const message = errorMessages[error.code] || errorMessages[error.name] || 'An error occurred. Please try again.';

  socket.emit('error', {
    message,
    context,
    canRetry: error.code !== 'ValidationError' && error.code !== 'CastError'
  });
};

module.exports = { retryOperation, handleSocketError };
