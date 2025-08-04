import { ApiError } from './enhancedApi';

export interface ErrorHandlerConfig {
  showToast?: boolean;
  logError?: boolean;
  redirectOnAuth?: boolean;
  customHandler?: (error: ApiError) => void;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp: Date;
  userAgent: string;
  url: string;
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error categories
export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  SERVER = 'server',
  CLIENT = 'client',
  BUSINESS_LOGIC = 'business_logic',
  UNKNOWN = 'unknown'
}

export interface ProcessedError {
  originalError: ApiError;
  category: ErrorCategory;
  severity: ErrorSeverity;
  userMessage: string;
  technicalMessage: string;
  suggestions: string[];
  context: ErrorContext;
  shouldRetry: boolean;
  retryAfter?: number;
}

class ErrorHandler {
  private errorLog: ProcessedError[] = [];
  private maxLogSize = 100;

  // Process and categorize errors
  processError(error: ApiError, context: Partial<ErrorContext> = {}): ProcessedError {
    const fullContext: ErrorContext = {
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context
    };

    const processedError: ProcessedError = {
      originalError: error,
      category: this.categorizeError(error),
      severity: this.determineSeverity(error),
      userMessage: this.generateUserMessage(error),
      technicalMessage: this.generateTechnicalMessage(error),
      suggestions: this.generateSuggestions(error),
      context: fullContext,
      shouldRetry: this.shouldRetry(error),
      retryAfter: this.getRetryDelay(error)
    };

    // Add to error log
    this.addToLog(processedError);

    return processedError;
  }

  // Categorize error based on status code and message
  private categorizeError(error: ApiError): ErrorCategory {
    if (!error.status) {
      return ErrorCategory.NETWORK;
    }

    switch (error.status) {
      case 401:
        return ErrorCategory.AUTHENTICATION;
      case 403:
        return ErrorCategory.AUTHORIZATION;
      case 400:
      case 422:
        return ErrorCategory.VALIDATION;
      case 404:
        return ErrorCategory.CLIENT;
      case 429:
        return ErrorCategory.CLIENT;
      case 500:
      case 502:
      case 503:
      case 504:
        return ErrorCategory.SERVER;
      default:
        if (error.status >= 400 && error.status < 500) {
          return ErrorCategory.CLIENT;
        } else if (error.status >= 500) {
          return ErrorCategory.SERVER;
        }
        return ErrorCategory.UNKNOWN;
    }
  }

  // Determine error severity
  private determineSeverity(error: ApiError): ErrorSeverity {
    if (!error.status) {
      return ErrorSeverity.MEDIUM; // Network errors
    }

    switch (error.status) {
      case 401:
      case 403:
        return ErrorSeverity.HIGH;
      case 500:
      case 502:
      case 503:
      case 504:
        return ErrorSeverity.CRITICAL;
      case 400:
      case 422:
        return ErrorSeverity.LOW;
      case 404:
        return ErrorSeverity.LOW;
      case 429:
        return ErrorSeverity.MEDIUM;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  // Generate user-friendly error messages
  private generateUserMessage(error: ApiError): string {
    if (!error.status) {
      return 'Connection problem. Please check your internet connection and try again.';
    }

    switch (error.status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 422:
        return error.message || 'Please check your input and try again.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Our team has been notified and is working on a fix.';
      case 502:
      case 503:
        return 'Service temporarily unavailable. Please try again in a few minutes.';
      case 504:
        return 'Request timeout. Please try again.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

  // Generate technical error messages for logging
  private generateTechnicalMessage(error: ApiError): string {
    let message = `Error ${error.status || 'NETWORK'}: ${error.message}`;
    
    if (error.code) {
      message += ` (Code: ${error.code})`;
    }
    
    if (error.details) {
      message += ` Details: ${JSON.stringify(error.details)}`;
    }

    return message;
  }

  // Generate suggestions for error resolution
  private generateSuggestions(error: ApiError): string[] {
    const suggestions: string[] = [];

    if (!error.status) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try refreshing the page');
      suggestions.push('Contact support if the problem persists');
      return suggestions;
    }

    switch (error.status) {
      case 400:
        suggestions.push('Verify all required fields are filled correctly');
        suggestions.push('Check data format and values');
        break;
      case 401:
        suggestions.push('Log in again');
        suggestions.push('Clear browser cache and cookies');
        break;
      case 403:
        suggestions.push('Contact your administrator for access');
        suggestions.push('Verify your account permissions');
        break;
      case 404:
        suggestions.push('Check the URL or resource ID');
        suggestions.push('Refresh the page');
        break;
      case 422:
        if (error.details?.missingFields) {
          suggestions.push(`Fill in missing fields: ${error.details.missingFields.join(', ')}`);
        }
        suggestions.push('Verify all input data is correct');
        break;
      case 429:
        suggestions.push('Wait a few minutes before trying again');
        suggestions.push('Reduce the frequency of requests');
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        suggestions.push('Try again in a few minutes');
        suggestions.push('Contact support if the problem persists');
        break;
      default:
        suggestions.push('Try again');
        suggestions.push('Contact support if the problem persists');
    }

    return suggestions;
  }

  // Determine if error should trigger a retry
  private shouldRetry(error: ApiError): boolean {
    if (!error.status) {
      return true; // Network errors can be retried
    }

    // Retry on server errors and rate limiting
    return [429, 500, 502, 503, 504].includes(error.status);
  }

  // Get retry delay based on error type
  private getRetryDelay(error: ApiError): number | undefined {
    if (!this.shouldRetry(error)) {
      return undefined;
    }

    switch (error.status) {
      case 429:
        return 5000; // 5 seconds for rate limiting
      case 500:
        return 2000; // 2 seconds for server errors
      case 502:
      case 503:
        return 10000; // 10 seconds for service unavailable
      case 504:
        return 3000; // 3 seconds for timeout
      default:
        return 1000; // 1 second default
    }
  }

  // Add error to log
  private addToLog(error: ProcessedError): void {
    this.errorLog.unshift(error);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
  }

  // Handle error with configuration
  handleError(error: ApiError, config: ErrorHandlerConfig = {}, context: Partial<ErrorContext> = {}): ProcessedError {
    const processedError = this.processError(error, context);

    // Log error if enabled
    if (config.logError !== false) {
      this.logError(processedError);
    }

    // Show toast notification if enabled
    if (config.showToast !== false) {
      this.showErrorToast(processedError);
    }

    // Handle authentication errors
    if (config.redirectOnAuth !== false && processedError.category === ErrorCategory.AUTHENTICATION) {
      this.handleAuthError();
    }

    // Call custom handler if provided
    if (config.customHandler) {
      config.customHandler(error);
    }

    return processedError;
  }

  // Log error to console and potentially to server
  private logError(error: ProcessedError): void {
    const logLevel = this.getLogLevel(error.severity);
    
    console[logLevel]('API Error:', {
      message: error.technicalMessage,
      category: error.category,
      severity: error.severity,
      context: error.context,
      originalError: error.originalError
    });

    // Send critical errors to server for monitoring
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.reportErrorToServer(error);
    }
  }

  // Get appropriate console log level
  private getLogLevel(severity: ErrorSeverity): 'log' | 'warn' | 'error' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'log';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'error';
      default:
        return 'warn';
    }
  }

  // Show error toast notification
  private showErrorToast(error: ProcessedError): void {
    // This would integrate with your toast notification system
    // For now, we'll use console.error as a placeholder
    console.error('Toast Error:', error.userMessage);
    
    // If you're using react-toastify or similar:
    // toast.error(error.userMessage);
  }

  // Handle authentication errors
  private handleAuthError(): void {
    // Clear auth data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    
    // Redirect to login
    window.location.href = '/login';
  }

  // Report critical errors to server
  private async reportErrorToServer(error: ProcessedError): Promise<void> {
    try {
      // This would send error data to your error tracking service
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: error.technicalMessage,
          category: error.category,
          severity: error.severity,
          context: error.context,
          stack: error.originalError.details
        })
      });
    } catch (reportError) {
      console.error('Failed to report error to server:', reportError);
    }
  }

  // Get error statistics
  getErrorStats(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recent: ProcessedError[];
  } {
    const stats = {
      total: this.errorLog.length,
      byCategory: {} as Record<ErrorCategory, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      recent: this.errorLog.slice(0, 10)
    };

    // Initialize counters
    Object.values(ErrorCategory).forEach(category => {
      stats.byCategory[category] = 0;
    });
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity] = 0;
    });

    // Count errors
    this.errorLog.forEach(error => {
      stats.byCategory[error.category]++;
      stats.bySeverity[error.severity]++;
    });

    return stats;
  }

  // Clear error log
  clearErrorLog(): void {
    this.errorLog = [];
  }

  // Get errors by category
  getErrorsByCategory(category: ErrorCategory): ProcessedError[] {
    return this.errorLog.filter(error => error.category === category);
  }

  // Get errors by severity
  getErrorsBySeverity(severity: ErrorSeverity): ProcessedError[] {
    return this.errorLog.filter(error => error.severity === severity);
  }
}

// Create and export error handler instance
const errorHandler = new ErrorHandler();
export default errorHandler;

// Export class for testing
export { ErrorHandler };

// Utility function for quick error handling
export function handleApiError(
  error: ApiError, 
  config: ErrorHandlerConfig = {}, 
  context: Partial<ErrorContext> = {}
): ProcessedError {
  return errorHandler.handleError(error, config, context);
}