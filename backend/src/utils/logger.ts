import { env } from '../config/env';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  requestId?: string;
  userId?: number;
  [key: string]: unknown;
}

class Logger {
  private format(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    if (env.NODE_ENV === 'production') {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...context,
      });
    }

    const reqIdTag = context?.requestId ? ` [Req: ${context.requestId}]` : '';
    const extra = context && Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}]${reqIdTag} ${message}${extra}`;
  }

  public info(message: string, context?: LogContext): void {
    process.stdout.write(this.format('info', message, context) + '\n');
  }

  public warn(message: string, context?: LogContext): void {
    process.stderr.write(this.format('warn', message, context) + '\n');
  }

  public error(message: string, context?: LogContext): void {
    process.stderr.write(this.format('error', message, context) + '\n');
  }

  public debug(message: string, context?: LogContext): void {
    if (env.NODE_ENV === 'development') {
      process.stdout.write(this.format('debug', message, context) + '\n');
    }
  }
}

export const logger = new Logger();
