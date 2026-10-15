import pino from 'pino';
import { env } from './env';
import { logRotatorAppStream, logRotatorErrorStream } from './log-rotator';

const streams: pino.StreamEntry[] = [
  {
    level: (env.NODE_ENV === 'development' ? 'debug' : 'info') as pino.Level,
    stream: process.stdout,
  },
  {
    level: (env.NODE_ENV === 'development' ? 'debug' : 'info') as pino.Level,
    stream: logRotatorAppStream,
  },
  {
    level: 'warn' as pino.Level,
    stream: logRotatorErrorStream,
  },
];

export const logger = pino(
  {
    level: env.NODE_ENV === 'development' ? 'debug' : 'info',
    base: {
      pid: process.pid,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.multistream(streams)
);
