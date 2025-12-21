import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

console.log('=== MAIN.TSX LOADED ===');
console.log('App imported:', typeof App);
console.log('createRoot available:', typeof createRoot);

// Limpar service workers e caches imediatamente em desenvolvimento
if ('serviceWorker' in navigator && !import.meta.env.PROD) {
  (async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        const success = await registration.unregister();
        if (success) {
          console.log('Service Worker unregistered for development');
        }
        if (registration.active) {
          registration.active.postMessage({ type: 'SKIP_WAITING' });
        }
      }
      // Limpar todos os caches em desenvolvimento
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          await caches.delete(name);
        }
        console.log('All caches cleared for development');
      }
    } catch (error) {
      console.warn('Error unregistering service worker:', error);
    }
  })();
}

// Register Service Worker for PWA (only in production)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Função para renderizar erro
function renderError(error: unknown, rootElement: HTMLElement) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : '';
  
  rootElement.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #050506; color: white; font-family: system-ui;">
      <div style="text-align: center; padding: 2rem; max-width: 600px;">
        <h1 style="color: #780606; margin-bottom: 1rem; font-size: 2rem;">Erro ao carregar aplicação</h1>
        <p style="color: #999; margin-bottom: 1.5rem;">Ocorreu um erro ao inicializar a aplicação.</p>
        <button 
          onclick="window.location.reload()" 
          style="padding: 0.75rem 1.5rem; background: #780606; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 1rem; margin-bottom: 1rem;"
        >
          Recarregar Página
        </button>
        <details style="margin-top: 1rem; text-align: left;">
          <summary style="cursor: pointer; color: #999; margin-bottom: 0.5rem;">Detalhes do erro</summary>
          <pre style="margin-top: 0.5rem; padding: 1rem; background: #111; border-radius: 0.5rem; overflow: auto; font-size: 0.875rem; color: #ff6b6b;">
${errorMessage}${errorStack ? '\n\n' + errorStack : ''}
          </pre>
        </details>
      </div>
    </div>
  `;
}

// Verificar se o elemento root existe
const rootElement = document.getElementById('root');
if (!rootElement) {
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #050506; color: white; font-family: system-ui;">
      <div style="text-align: center; padding: 2rem;">
        <h1 style="color: #780606; margin-bottom: 1rem;">Erro: Elemento root não encontrado</h1>
        <p style="color: #999;">O elemento com id "root" não foi encontrado no HTML.</p>
      </div>
    </div>
  `;
  throw new Error('Root element not found');
}

// Limpar qualquer conteúdo padrão do Vite que possa estar no root
const rootContent = rootElement.innerHTML;
if (rootContent.includes('Vite') || rootContent.includes('count is') || rootContent.includes('Edit src/App.tsx')) {
  console.warn('Conteúdo padrão do Vite detectado no root, limpando...');
  rootElement.innerHTML = '';
}

// Garantir que o root está vazio e configurado corretamente
rootElement.innerHTML = '';
rootElement.style.minHeight = '100vh';
rootElement.style.display = 'block';

console.log('Root element prepared, starting app render...');

// Verificar se App foi importado corretamente
if (!App) {
  const error = new Error('App component não foi exportado corretamente');
  console.error('Failed to import App:', error);
  renderError(error, rootElement);
  throw error;
}

// Renderizar a aplicação
try {
  console.log('Creating React root...');
  const root = createRoot(rootElement);
  console.log('Root created successfully');
  
  console.log('Rendering App component...');
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  
  console.log('=== APP RENDERED SUCCESSFULLY ===');
} catch (renderError: unknown) {
  console.error('Failed to render app:', renderError);
  // Error already logged, app will show error boundary
}
