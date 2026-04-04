import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Standardize formatting: [Timestamp] [Level]: Message
const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
});

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }), 
        logFormat
    ),
    transports: [
        // Console output (with color)
        new winston.transports.Console({
            format: combine(colorize(), logFormat),
        }),
        // Basic file transport for standard logs
        new winston.transports.File({ filename: 'logs/combined.log' }),
        // Distinct file for errors only
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    ],
});

export default logger;
