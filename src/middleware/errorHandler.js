const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error.status = 400;
    error.message = 'Validation Error';
  } else if (err.name === 'UnauthorizedError') {
    error.status = 401;
    error.message = 'Unauthorized';
  } else if (err.code === 'ENOTFOUND') {
    error.status = 404;
    error.message = 'API endpoint not found';
  } else if (err.response && err.response.status) {
    error.status = err.response.status;
    error.message = err.response.data?.message || err.message;
  }

  res.status(error.status).json(error);
};

module.exports = errorHandler; 