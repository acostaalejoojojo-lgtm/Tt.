import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Buffer } from 'buffer';

// Polyfills for GUN and simple-peer
(window as any).global = window;
(window as any).Buffer = Buffer;
(window as any).process = { env: {}, nextTick: (cb: any) => setTimeout(cb, 0) };

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);