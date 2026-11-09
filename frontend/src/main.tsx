import React from 'react'
import ReactDOM from 'react-dom/client'
// index.css primero: es la base; extra.css y pantallas.css (en App) la ajustan
import './index.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
