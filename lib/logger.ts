export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
  userId?: string;
  action: string;
  [key: string]: any;
}

/**
 * Structured logger for TOVEDROP
 * Outputs JSON format that is easily parsed by Datadog, Axiom, and Vercel Logs.
 */
class Logger {
  private formatLog(level: LogLevel, message: string, context?: LogContext, error?: unknown) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context || {}),
    };

    if (error) {
      if (error instanceof Error) {
        logEntry['errorName'] = error.name;
        logEntry['errorMessage'] = error.message;
        logEntry['errorStack'] = error.stack;
      } else {
        logEntry['errorRaw'] = String(error);
      }
    }

    return JSON.stringify(logEntry);
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatLog('info', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatLog('warn', message, context));
  }

  error(message: string, error?: unknown, context?: LogContext) {
    console.error(this.formatLog('error', message, context, error));
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatLog('debug', message, context));
    }
  }
}

export const logger = new Logger();
