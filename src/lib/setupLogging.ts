type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const normalizeLevel = (level?: string | null): LogLevel => {
  if (!level) {
    return import.meta.env.PROD ? 'warn' : 'debug';
  }
  const safeLevel = level.toLowerCase() as LogLevel;
  if (safeLevel in LEVEL_PRIORITY) {
    return safeLevel;
  }
  return import.meta.env.PROD ? 'warn' : 'debug';
};

const ENV_LEVEL = normalizeLevel(import.meta.env.VITE_LOG_LEVEL);

const shouldLog = (level: LogLevel) => LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[ENV_LEVEL];

const originalConsole = {
  log: console.log.bind(console),
  info: console.info ? console.info.bind(console) : console.log.bind(console),
  debug: console.debug ? console.debug.bind(console) : console.log.bind(console),
  warn: console.warn ? console.warn.bind(console) : console.log.bind(console),
  error: console.error ? console.error.bind(console) : console.log.bind(console),
};

const wrap =
  (level: LogLevel, fn: (...args: unknown[]) => void) =>
  (...args: unknown[]) => {
    if (shouldLog(level)) {
      fn(...args);
    }
  };

console.debug = wrap('debug', originalConsole.debug);
console.log = wrap('debug', originalConsole.log);
console.info = wrap('info', originalConsole.info);
console.warn = wrap('warn', originalConsole.warn);
console.error = wrap('error', originalConsole.error);

