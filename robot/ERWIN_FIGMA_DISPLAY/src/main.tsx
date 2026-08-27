import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import LiveDisplayApp from './LiveDisplayApp'
import './index.css'

const isPreview = new URLSearchParams(window.location.search).has('preview')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isPreview ? <App /> : <LiveDisplayApp />}
  </React.StrictMode>,
)
