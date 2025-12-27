import type { EnvironmentType } from '@rig/schema'

type LogLevel = 'critical' | 'error' | 'warning' | 'info' | 'debug'

interface LogContext {
  [key: string]: any
}

interface StructuredLog {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  service?: string
  environment?: string
}

const parseEnvironment = (value: string | undefined): EnvironmentType => {
  switch (value) {
    case 'local':
    case 'staging':
    case 'prod':
      return value
    default:
      return 'local'
  }
}

class Logger {
  private readonly isLocal: boolean
  private readonly service: string
  private readonly environment: EnvironmentType

  constructor () {
    this.environment = parseEnvironment(process.env.NODE_ENV)
    this.isLocal = this.environment === 'local'
    this.service = process.env.SERVICE_NAME ?? 'unknown-service'
  }

  critical (message: string, context?: LogContext): void {
    this.log('critical', message, context)
  }

  error (message: string, context?: LogContext): void {
    this.log('error', message, context)
  }

  warning (message: string, context?: LogContext): void {
    this.log('warning', message, context)
  }

  info (message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  debug (message: string, context?: LogContext): void {
    this.log('debug', message, context)
  }

  private log (level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString()

    if (this.isLocal) {
      this.prettyPrint(level, message, timestamp, context)
    } else {
      this.structuredLog(level, message, timestamp, context)
    }
  }

  private prettyPrint (
    level: LogLevel,
    message: string,
    timestamp: string,
    context?: LogContext
  ): void {
    const colors = {
      critical: '\x1b[41m\x1b[37m', // White text on red background
      error: '\x1b[31m', // Red
      warning: '\x1b[33m', // Yellow
      info: '\x1b[36m', // Cyan
      debug: '\x1b[90m' // Gray
    }
    const reset = '\x1b[0m'
    const color = colors[level]

    const time = new Date(timestamp).toLocaleTimeString()
    const levelUpper = level.toUpperCase().padEnd(8)

    console.log(`${color}[${time}] ${levelUpper}${reset} ${message}`)

    if (context !== undefined && Object.keys(context).length > 0) {
      console.log(`${color}└─${reset}`, context)
    }
  }

  private structuredLog (
    level: LogLevel,
    message: string,
    timestamp: string,
    context?: LogContext
  ): void {
    const log: StructuredLog = {
      timestamp,
      level,
      message,
      service: this.service,
      environment: this.environment
    }

    if (context !== undefined && Object.keys(context).length > 0) {
      log.context = context
    }

    // AWS CloudWatch expects JSON on a single line
    console.log(JSON.stringify(log))
  }
}

// Singleton instance
const loggerInstance = new Logger()

// Main exports
export const logger = {
  critical: (message: string, context?: LogContext) => loggerInstance.critical(message, context),
  error: (message: string, context?: LogContext) => loggerInstance.error(message, context),
  warning: (message: string, context?: LogContext) => loggerInstance.warning(message, context),
  info: (message: string, context?: LogContext) => loggerInstance.info(message, context),
  debug: (message: string, context?: LogContext) => loggerInstance.debug(message, context)
}

// Type exports
export type { LogLevel, LogContext }
