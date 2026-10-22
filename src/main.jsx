import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import RetroDesktop from './RetroDesktop.jsx'
import AboutPage from './AboutPage.jsx'

// Restore a deep link forwarded by public/404.html as ?p=/path
const params = new URLSearchParams(window.location.search);
const redirect = params.get('p');
if (redirect) {
  params.delete('p');
  const query = params.toString();
  // Only same-origin paths ("//host" or "/\host" would be cross-origin and throw)
  const path = /^\/(?![\/\\])/.test(redirect) ? redirect : '/';
  history.replaceState(null, '', path + (query ? '?' + query : '') + window.location.hash);
}

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Ignore trailing slashes so /about/ matches /about
  const route = path.replace(/\/+$/, '') || '/';

  useEffect(() => {
    document.title = route === '/about' ? 'About - George D. Fekaris' : 'George D. Fekaris';
  }, [route]);

  if (route === '/about') return <AboutPage />;
  return <RetroDesktop />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
