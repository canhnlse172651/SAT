import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { useSessionStore } from './features/session/session-store';
import { loadFonts } from './lib/fonts';
import './styles/index.css';

loadFonts();
// Ask who is signed in while the first screen's code is still downloading (the guards would ask only after it).
void useSessionStore.getState().load();

const root = document.getElementById('root');
if (!root) throw new Error('#root element is missing from index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
