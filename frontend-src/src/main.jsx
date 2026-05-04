import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Kode ini mencari elemen dengan id="root" di index.html
// Lalu me-render (menggambar) komponen App.jsx kita ke dalamnya
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)