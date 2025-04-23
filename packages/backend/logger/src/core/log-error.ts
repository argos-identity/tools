// logger/core/log-error.ts
import logger from './logger-instance';

interface ErrorLogOptions {
  error: Error;
  context?: Record<string, any>;
  request?: any;
}

export const logError = ({ error, context = {}, request }: ErrorLogOptions): void => {
  logger.error('Application Error', {
    message: error.message,
    name: error.name,
    stack: error.stack,
    context,
    request,
  });
};
