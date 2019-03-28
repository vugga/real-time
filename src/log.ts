/**
 * Basic logger
 */
import pino from 'pino';

const l = pino({
  name: process.env.APP_ID || 'server-log',
  level: process.env.LOG_LEVEL || 'debug'
});

export default l;