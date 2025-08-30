// Bridge console warnings/errors to in-app notifications

function toMessage(args) {
  try {
    return args
      .map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))
      .join(' ');
  } catch {
    return args.map(String).join(' ');
  }
}

export function installConsoleBridge(addNotification, options = {}) {
  const config = {
    log: false,
    info: false,
    warn: true,
    error: true,
    dedupeMs: 5000,
    ...options,
  };

  const originals = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  // simple dedupe to avoid spam
  const lastShownAt = new Map();
  const shouldShow = (msg) => {
    const now = Date.now();
    const last = lastShownAt.get(msg) || 0;
    if (now - last < config.dedupeMs) return false;
    lastShownAt.set(msg, now);
    return true;
  };

  if (config.log) {
    console.log = (...args) => {
      originals.log.apply(console, args);
      const msg = toMessage(args);
      if (shouldShow(msg)) addNotification(msg, 'info');
    };
  }

  if (config.info) {
    console.info = (...args) => {
      originals.info.apply(console, args);
      const msg = toMessage(args);
      if (shouldShow(msg)) addNotification(msg, 'info');
    };
  }

  if (config.warn) {
    console.warn = (...args) => {
      originals.warn.apply(console, args);
      const msg = toMessage(args);
      if (shouldShow(msg)) addNotification(msg, 'warning');
    };
  }

  if (config.error) {
    console.error = (...args) => {
      originals.error.apply(console, args);
      const msg = toMessage(args);
      if (shouldShow(msg)) addNotification(msg, 'error');
    };
  }

  // Uninstall/restore
  return function uninstallConsoleBridge() {
    console.log = originals.log;
    console.info = originals.info;
    console.warn = originals.warn;
    console.error = originals.error;
  };
}


