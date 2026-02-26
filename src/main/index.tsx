import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import '../styles/globals.css';

// ==================== Startup Performance Analysis ====================
const isProduction = process.env.NODE_ENV === 'production' || !import.meta.env.DEV;
let startupStartTime = 0;

if (!isProduction) {
  startupStartTime = performance.now();
  console.log('🚀 [STARTUP] React application starting...');

  // Check localStorage performance
  try {
    const lsStartTime = performance.now();
    const testData = localStorage.getItem('investmentRecords');
    const lsEndTime = performance.now();
    console.log(`⏱️ [STARTUP] localStorage read (investmentRecords) took: ${(lsEndTime - lsStartTime).toFixed(2)}ms`);
    if (testData) {
      console.log(`📦 [STARTUP] Initial data size: ${(testData.length / 1024).toFixed(2)} KB`);
    }
  } catch (e) {
    console.error('❌ [STARTUP] localStorage health check failed:', e);
  }
}
// ==================== End Startup Performance Analysis ====================

// ==================== Global Error Capture ====================
if (!isProduction) {
  // Capture unhandled Promise errors
  window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ [GLOBAL] Unhandled Promise Rejection:', {
      reason: event.reason,
      promise: event.promise,
      stack: event.reason?.stack
    });
  });

  // Capture global errors
  window.addEventListener('error', (event) => {
    console.error('❌ [GLOBAL] Global Error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      stack: event.error?.stack
    });
  });

  // Capture errors not caught by React error boundaries
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Pay special attention to lazy loading related errors
    const message = args.join(' ');
    if (message.includes('lazy') || message.includes('Suspense') || message.includes('chunk')) {
      console.log('⚠️ [LAZY-LOAD] Detected lazy loading issue:', message);
    }
    originalConsoleError.apply(console, args);
  };
}
// ==================== End Global Error Capture ====================

// One-time fake data cleanup script - will be automatically cleared after restarting the application
const CLEAR_FAKE_DATA = false; // Please set to false after cleanup is complete

if (CLEAR_FAKE_DATA) {
  console.log('🗑️ Clearing fake data...');

  // Clear all investment record data
  const keysToRemove = [
    'investmentRecords',
    'initialAssets',
    'investmentAccounts',
    'accounts'
  ];

  let clearedCount = 0;
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`Clearing: ${key}`);
      localStorage.removeItem(key);
      clearedCount++;
    }
  });

  if (clearedCount > 0) {
    console.log(`✅ Cleared ${clearedCount} fake data items`);
    console.log('⚠️ Note: Please change CLEAR_FAKE_DATA to false in src/main/index.tsx');
  } else {
    console.log('ℹ️ No data found to clear');
  }
}

// Clean up deprecated risk configuration data
const CLEANUP_KEY = 'risk-config-cleanup-v2';
if (!localStorage.getItem(CLEANUP_KEY)) {
  localStorage.removeItem('risk-config');
  localStorage.setItem(CLEANUP_KEY, new Date().toISOString());
  console.log('✅ Cleaned up deprecated risk configuration data');
}

// Detect if running in production environment
// const isProduction = process.env.NODE_ENV === 'production' || !import.meta.env.DEV; // Moved to top

if (!isProduction) {
  console.log('🔍 [MAIN] Environment Info:', {
    isProduction,
    NODE_ENV: process.env.NODE_ENV,
    mode: import.meta.env.MODE,
    href: window.location.href,
    hash: window.location.hash
  });
}

// Remove StrictMode in production to avoid potential hanging issues caused by double rendering
const AppWrapper = isProduction ? (
  <HashRouter>
    <App />
  </HashRouter>
) : (
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);

ReactDOM.createRoot(document.getElementById('root')!).render(AppWrapper);

if (!isProduction) {
  // @ts-ignore
  const startupTotalTime = performance.now() - startupStartTime;
  console.log(`✅ [MAIN] React app mounted in ${startupTotalTime.toFixed(2)}ms`);
}
