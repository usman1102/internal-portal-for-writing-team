import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Hide Replit banner in PWA mode
if (window.matchMedia('(display-mode: standalone)').matches) {
  // Remove any Replit banners or development elements
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          const element = node as Element;
          if (element.tagName === 'IFRAME' && element.getAttribute('src')?.includes('replit')) {
            element.remove();
          }
          if (element.className?.includes('replit')) {
            element.remove();
          }
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Remove existing Replit elements
  setTimeout(() => {
    const replitElements = document.querySelectorAll('iframe[src*="replit"], [class*="replit"]');
    replitElements.forEach(el => el.remove());
  }, 100);
}

// Hide loading screen once app is ready
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.remove();
    }, 300);
  }
}

// Create root and render app
const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Hide loading screen after a short delay to ensure app is rendered
setTimeout(hideLoadingScreen, 500);
