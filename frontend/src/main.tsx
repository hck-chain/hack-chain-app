import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './i18n/index.ts'
import './index.css'
import './config/walletConfig'; // Initialize AppKit at startup
createRoot(document.getElementById("root")!).render(<App />);
