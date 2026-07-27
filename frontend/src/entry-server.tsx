import { renderToString } from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { StaticRouter } from 'react-router-dom/server';
import App from './App';
import { SiteUrlContext } from './lib/site-url';

export function render(url: string, origin = '') {
  const helmetContext: Record<string, any> = {};

  renderToString(
    <HelmetProvider context={helmetContext}>
      <SiteUrlContext.Provider value={origin}>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </SiteUrlContext.Provider>
    </HelmetProvider>
  );

  return { helmetContext };
}
