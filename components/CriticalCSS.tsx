import { useEffect } from 'react';

const criticalStyles = `
  /* Critical styles for above-the-fold content */
  .cardinals-gradient {
    background: linear-gradient(135deg, #97233F 0%, #000000 100%);
  }
  
  /* Prevent layout shifts */
  .hero-container {
    min-height: 200px;
  }
  
  /* Navigation critical styles */
  .nav-tab {
    transition: none;
    border-bottom: 2px solid transparent;
  }
  
  .nav-tab.active {
    border-bottom-color: #97233F;
    color: #97233F;
  }
  
  /* Loading states to prevent CLS */
  .loading-skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }
  
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  /* Prevent font swap CLS */
  .font-loading {
    font-display: swap;
    font-family: system-ui, -apple-system, sans-serif;
  }
  
  /* Image container to prevent CLS */
  .img-container {
    position: relative;
    display: inline-block;
  }
  
  .img-container::before {
    content: '';
    display: block;
    width: 100%;
    height: 0;
    padding-bottom: 100%; /* Adjust based on aspect ratio */
  }
  
  .img-container img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

export default function CriticalCSS() {
  useEffect(() => {
    // Inject critical CSS immediately
    const style = document.createElement('style');
    style.textContent = criticalStyles;
    style.setAttribute('data-critical', 'true');
    document.head.insertBefore(style, document.head.firstChild);

    return () => {
      // Cleanup on unmount
      const criticalStyle = document.querySelector('style[data-critical="true"]');
      if (criticalStyle) {
        criticalStyle.remove();
      }
    };
  }, []);

  return null;
}