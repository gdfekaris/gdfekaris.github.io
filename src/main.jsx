import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import RetroDesktop from './RetroDesktop.jsx'
import AboutPage from './AboutPage.jsx'

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  if (path === '/about') return <AboutPage />;
  return <RetroDesktop />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
