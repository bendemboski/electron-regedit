const { basename } = require('path');
const {
  transports,
  error,
  warn,
  info,
  verbose,
  debug,
  silly,
  log
} = require('electron-log');

function createLogger(filepath) {
  let filename = basename(filepath);
  return {
    transports,
    error: (str, ...args) => error(`[${filename}] ${str}`, ...args),
    warn: (str, ...args) => warn(`[${filename}] ${str}`, ...args),
    info: (str, ...args) => info(`[${filename}] ${str}`, ...args),
    verbose: (str, ...args) => verbose(`[${filename}] ${str}`, ...args),
    debug: (str, ...args) => debug(`[${filename}] ${str}`, ...args),
    silly: (str, ...args) => silly(`[${filename}] ${str}`, ...args),
    log: (str, ...args) => log(`[${filename}] ${str}`, ...args)
  };
}

module.exports = createLogger;
