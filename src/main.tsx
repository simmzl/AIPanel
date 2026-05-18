import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootEl = document.getElementById('root') as HTMLElement;

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Remove the inline skeleton once React owns the DOM.
// rAF gives React a frame to paint its initial output first, avoiding a flash of empty area.
requestAnimationFrame(() => {
  const skeleton = document.getElementById('aip-skeleton');
  if (skeleton && skeleton.parentNode) {
    skeleton.parentNode.removeChild(skeleton);
  }
});
