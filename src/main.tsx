import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Get saved language preference
const savedLanguage = localStorage.getItem('language') || 'en';
const isRTL = savedLanguage === 'ar';

// Apply correct language and direction
document.documentElement.lang = savedLanguage;
document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
document.body.style.direction = isRTL ? 'rtl' : 'ltr';

// Apply RTL class if needed
if (isRTL) {
  document.body.classList.add('rtl');
} else {
  document.body.classList.remove('rtl');
}

// Ensure styles for RTL override are available
const style = document.createElement('style')
style.textContent = `
  .rtl-override {
    direction: ltr !important;
    text-align: left !important;
  }
`
document.head.appendChild(style)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
