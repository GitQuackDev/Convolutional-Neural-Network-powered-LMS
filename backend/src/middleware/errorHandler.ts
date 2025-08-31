import { Request, Response, NextFunction } from 'express';

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
}

export const errorHandler = (
  err: ErrorWithStatus, 
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Determine status code
  const statusCode = err.status || err.statusCode || 500;

  // Determine error message
  const message = statusCode === 500 ? 'Internal Server Error' : err.message;

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env['NODE_ENV'] === 'development' && {
      stack: err.stack,
      details: err.message
    })
  });
};
