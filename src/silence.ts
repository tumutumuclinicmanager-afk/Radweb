// Pre-import console silencing to catch Firestore quota exceptions before SDK initializes
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;

  const getArgString = (arg: any): string => {
    if (!arg) return '';
    try {
      if (arg instanceof Error) {
        return `${arg.name || ''} ${arg.message || ''} ${arg.stack || ''}`;
      }
      if (typeof arg === 'object') {
        const message = arg.message || arg.code || arg.description || '';
        const name = arg.name || arg.constructor?.name || '';
        let serialized = '';
        try {
          serialized = JSON.stringify(arg);
        } catch {}
        return `${name} ${message} ${serialized} ${String(arg)}`;
      }
      return String(arg);
    } catch {
      return String(arg);
    }
  };

  const isQuotaOrBenignMessage = (args: any[]): boolean => {
    return args.some(arg => {
      const lower = getArgString(arg).toLowerCase();
      return (
        lower.includes('quota') ||
        lower.includes('exceeded') ||
        lower.includes('resource-exhausted') ||
        lower.includes('resource_exhausted') ||
        lower.includes('free daily write units') ||
        lower.includes('disconnecting idle stream') ||
        lower.includes('grpcconnection rpc') ||
        lower.includes('timed out waiting for new targets') ||
        lower.includes('8 resource_exhausted')
      );
    });
  };

  console.error = function (...args: any[]) {
    if (isQuotaOrBenignMessage(args)) return;
    originalError.apply(console, args);
  };

  console.warn = function (...args: any[]) {
    if (isQuotaOrBenignMessage(args)) return;
    originalWarn.apply(console, args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason) {
      const lower = getArgString(reason).toLowerCase();
      if (
        lower.includes('quota') ||
        lower.includes('exceeded') ||
        lower.includes('resource-exhausted') ||
        lower.includes('resource_exhausted') ||
        lower.includes('8 resource_exhausted')
      ) {
        event.preventDefault(); // Stop event from bubble logging
        event.stopPropagation();
      }
    }
  }, true);

  window.addEventListener('error', (event) => {
    const lower = (event.message || '').toLowerCase();
    if (
      lower.includes('quota') ||
      lower.includes('exceeded') ||
      lower.includes('resource-exhausted') ||
      lower.includes('resource_exhausted') ||
      lower.includes('8 resource_exhausted')
    ) {
      event.preventDefault(); // Swallow error
      event.stopPropagation();
    }
  }, true);
}
