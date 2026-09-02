import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign internal Firestore connection stream warnings when connections go idle
const originalError = console.error;
const originalWarn = console.warn;

console.error = function (...args: any[]) {
  const msg = args.map(arg => typeof arg === 'string' ? arg : (arg && arg.message ? arg.message : String(arg))).join(' ');
  if (msg.includes('Disconnecting idle stream') || msg.includes('GrpcConnection RPC') || msg.includes('timed out waiting for new targets')) {
    return;
  }
  originalError.apply(console, args);
};

console.warn = function (...args: any[]) {
  const msg = args.map(arg => typeof arg === 'string' ? arg : (arg && arg.message ? arg.message : String(arg))).join(' ');
  if (msg.includes('Disconnecting idle stream') || msg.includes('GrpcConnection RPC') || msg.includes('timed out waiting for new targets')) {
    return;
  }
  originalWarn.apply(console, args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
