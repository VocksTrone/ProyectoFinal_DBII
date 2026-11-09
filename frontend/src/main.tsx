import React from 'react'
import ReactDOM from 'react-dom/client'
// index.css va primero; extra.css y pantallas.css (en App) lo ajustan
import './index.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
