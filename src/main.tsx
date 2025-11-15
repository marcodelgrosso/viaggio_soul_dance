import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './lib/setupLogging';
import './styles/main.scss';

// In produzione, StrictMode può causare rimontaggi non desiderati
// Manteniamolo solo in sviluppo
const root = ReactDOM.createRoot(document.getElementById('root')!);

if (import.meta.env.DEV) {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  root.render(<App />);
}


