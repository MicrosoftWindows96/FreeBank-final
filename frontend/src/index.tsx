import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './i18n';
import { ThemeProvider } from './contexts/ThemeContext';
import { CurrencyDisplayProvider } from './contexts/CurrencyDisplayContext';

import 'core-js/stable';
import 'regenerator-runtime/runtime';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <CurrencyDisplayProvider>
        <App />
      </CurrencyDisplayProvider>
    </ThemeProvider>
  </React.StrictMode>
);

reportWebVitals();
