import { useNavigate, type NavigateOptions, type To } from 'react-router-dom';
import { useApp } from '@/hooks/useApp';
import { useCallback } from 'react';

export const useAppNavigate = () => {
  const navigate = useNavigate();
  const { origin, mountPath, isConnectionInQuery } = useApp();

  const appNavigate = useCallback((to: To, options?: NavigateOptions) => {
    if (isConnectionInQuery && mountPath) {
      if (typeof to === 'string') {
        const [path, search] = to.split('?');
        const params = new URLSearchParams(search);
        if (origin) params.set('origin', origin);
        params.set('mountPath', mountPath);
        navigate(`${path}?${params.toString()}`, options);
      } else {
        const search = to.search || '';
        const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
        if (origin) params.set('origin', origin);
        params.set('mountPath', mountPath);
        navigate({ ...to, search: `?${params.toString()}` }, options);
      }
    } else {
      navigate(to, options);
    }
  }, [navigate, origin, mountPath, isConnectionInQuery]);

  return appNavigate;
};

