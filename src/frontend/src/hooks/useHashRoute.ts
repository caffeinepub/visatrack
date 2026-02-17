import { useState, useEffect } from 'react';

export type HashRoute = 'home' | 'visa-check';

export function useHashRoute(): [HashRoute, (route: HashRoute) => void] {
  const getRouteFromHash = (): HashRoute => {
    const hash = window.location.hash.slice(1);
    if (hash === 'visa-check') return 'visa-check';
    return 'home';
  };

  const [route, setRouteState] = useState<HashRoute>(getRouteFromHash);

  useEffect(() => {
    const handleHashChange = () => {
      setRouteState(getRouteFromHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const setRoute = (newRoute: HashRoute) => {
    window.location.hash = newRoute === 'home' ? '' : newRoute;
  };

  return [route, setRoute];
}
