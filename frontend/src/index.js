// src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// --- IMPORTS FROM MATERIAL-UI ---
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// --- THEME CREATION ---
const theme = createTheme({
  palette: {
    primary: {
      main: '#6b46c1', // The purple color from your Getstart page
    },
    secondary: {
      main: '#553c9a',
    },
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* --- WRAP YOUR APP WITH THE THEME PROVIDER --- */}
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);