import { useNavigate, type NavigateOptions, type To } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useCallback } from 'react';

export const useAppNavigate = () => {
  const navigate = useNavigate();
  const { hostUrl, isHostUrlInQuery } = useApp();

  const appNavigate = useCallback((to: To, options?: NavigateOptions) => {
    if (isHostUrlInQuery && hostUrl) {
      if (typeof to === 'string') {
        const [path, search] = to.split('?');
        const params = new URLSearchParams(search);
        params.set('hostUrl', hostUrl);
        navigate(`${path}?${params.toString()}`, options);
      } else {
        const search = to.search || '';
        const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
        params.set('hostUrl', hostUrl);
        navigate({ ...to, search: `?${params.toString()}` }, options);
      }
    } else {
      navigate(to, options);
    }
  }, [navigate, hostUrl, isHostUrlInQuery]);

  return appNavigate;
};

