import fs from 'fs';
import path from 'path';
import { Writable } from 'stream';

// Locate root logs directory reliably
const resolveLogsDir = (): string => {
  const cur = process.cwd();
  let targetDir = path.join(cur, 'logs');

  if (cur.endsWith(path.join('apps', 'api')) || cur.endsWith('apps/api') || cur.endsWith('apps\\api')) {
    targetDir = path.resolve(cur, '..', '..', 'logs');
  } else if (fs.existsSync(path.join(cur, 'apps', 'api'))) {
    targetDir = path.join(cur, 'logs');
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  return targetDir;
};

export const LOGS_DIR = resolveLogsDir();

const getTodayDateStr = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 30-Day Log Retention Cleaner
 * Removes log files older than 30 days.
 */
export const cleanOldLogs = (retentionDays = 30) => {
  try {
    if (!fs.existsSync(LOGS_DIR)) return;

    const files = fs.readdirSync(LOGS_DIR);
    const now = Date.now();
    const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const match = file.match(/^(?:app|error)-(\d{4}-\d{2}-\d{2})\.log$/);
      if (match && match[1]) {
        const fileDate = new Date(match[1]).getTime();
        if (!isNaN(fileDate) && now - fileDate > maxAgeMs) {
          try {
            fs.unlinkSync(path.join(LOGS_DIR, file));
          } catch {
            // ignore unlink error
          }
        }
      }
    }
  } catch {
    // Non-blocking cleanup failure
  }
};

/**
 * Daily Rotating File Stream
 */
class DailyRotatingFileStream extends Writable {
  private prefix: 'app' | 'error';
  private currentDate: string;
  private currentStream: fs.WriteStream | null = null;

  constructor(prefix: 'app' | 'error') {
    super();
    this.prefix = prefix;
    this.currentDate = getTodayDateStr();
    this.initStream();
    cleanOldLogs(30);
  }

  private initStream() {
    if (this.currentStream) {
      try {
        this.currentStream.end();
      } catch {
        // ignore
      }
    }

    const filePath = path.join(LOGS_DIR, `${this.prefix}-${this.currentDate}.log`);
    this.currentStream = fs.createWriteStream(filePath, { flags: 'a', encoding: 'utf8' });
  }

  private checkRotate() {
    const today = getTodayDateStr();
    if (today !== this.currentDate) {
      this.currentDate = today;
      this.initStream();
      cleanOldLogs(30);
    }
  }

  _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    try {
      this.checkRotate();
      if (this.currentStream) {
        this.currentStream.write(chunk, encoding, callback);
      } else {
        callback();
      }
    } catch (err: any) {
      callback(err);
    }
  }

  _final(callback: (error?: Error | null) => void): void {
    if (this.currentStream) {
      this.currentStream.end(callback);
    } else {
      callback();
    }
  }
}

export const logRotatorAppStream = new DailyRotatingFileStream('app');
export const logRotatorErrorStream = new DailyRotatingFileStream('error');

/**
 * Helpers for Admin Dashboard Log Inspection & Download
 */
export interface LogFileInfo {
  date: string;
  appFile: string | null;
  appSizeBytes: number;
  errorFile: string | null;
  errorSizeBytes: number;
  totalSizeBytes: number;
}

export const listAvailableLogs = (): LogFileInfo[] => {
  if (!fs.existsSync(LOGS_DIR)) return [];

  const files = fs.readdirSync(LOGS_DIR);
  const dateMap = new Map<string, { appFile: string | null; appSize: number; errorFile: string | null; errorSize: number }>();

  for (const file of files) {
    const match = file.match(/^(app|error)-(\d{4}-\d{2}-\d{2})\.log$/);
    if (!match) continue;

    const [, type, date] = match;
    const stat = fs.statSync(path.join(LOGS_DIR, file));

    if (!dateMap.has(date)) {
      dateMap.set(date, { appFile: null, appSize: 0, errorFile: null, errorSize: 0 });
    }

    const entry = dateMap.get(date)!;
    if (type === 'app') {
      entry.appFile = file;
      entry.appSize = stat.size;
    } else {
      entry.errorFile = file;
      entry.errorSize = stat.size;
    }
  }

  const result: LogFileInfo[] = Array.from(dateMap.entries()).map(([date, data]) => ({
    date,
    appFile: data.appFile,
    appSizeBytes: data.appSize,
    errorFile: data.errorFile,
    errorSizeBytes: data.errorSize,
    totalSizeBytes: data.appSize + data.errorSize,
  }));

  // Sort descending by date
  return result.sort((a, b) => b.date.localeCompare(a.date));
};

export const getLogFilePath = (filename: string): string => {
  // Strict regex check to prevent path traversal
  if (!/^(app|error)-\d{4}-\d{2}-\d{2}\.log$/.test(filename)) {
    throw new Error('Invalid log filename pattern');
  }

  const safePath = path.join(LOGS_DIR, filename);
  if (!fs.existsSync(safePath)) {
    throw new Error('Log file not found');
  }

  return safePath;
};

export const readLogLines = (filename: string, search?: string, limit = 200): string[] => {
  const filePath = getLogFilePath(filename);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter((l) => l.trim().length > 0);

  let filtered = lines;
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = lines.filter((l) => l.toLowerCase().includes(q));
  }

  return filtered.slice(-limit);
};
