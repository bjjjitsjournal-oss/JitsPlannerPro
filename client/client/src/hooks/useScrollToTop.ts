import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function useScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    // Scroll to top when route changes with smooth behavior
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Use instant for immediate scroll on route changes
    });
    
    // Also ensure the document body is scrolled to top for mobile
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, [location]);
}