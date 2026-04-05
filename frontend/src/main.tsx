import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './i18n/index.ts'
import './index.css'

console.log("🔍 Debug API URL:", import.meta.env.VITE_API_URL);

createRoot(document.getElementById("root")!).render(<App />);
