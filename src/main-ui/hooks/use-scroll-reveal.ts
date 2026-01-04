import { useEffect } from 'react';

export function useScrollReveal(): void {
  useEffect(() => {
    let scrollTimeout: ReturnType<typeof setTimeout>;

    const handleScroll = (e: Event): void => {
      const target = e.target as HTMLElement;
      if (!target.classList) return;
      
      target.classList.add('is-scrolling');

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        target.classList.remove('is-scrolling');
      }, 1000);
    };

    document.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('scroll', handleScroll, true);
      clearTimeout(scrollTimeout);
    };
  }, []);
}
