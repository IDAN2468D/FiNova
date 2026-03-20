import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean | string;
  showErrorToast?: boolean | string;
}

/**
 * A robust Custom Hook for handling API requests across all pages.
 * Features built-in Loading State, Error Handling, and Toast Notifications.
 */
export function useApi<T = any>() {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (
      url: string,
      options: RequestInit = {},
      hooksOps: UseApiOptions<T> = {}
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || result.error || 'אירעה שגיאת שרת לא צפויה');
        }

        setData(result);
        if (hooksOps.onSuccess) hooksOps.onSuccess(result);
        
        // Show automatic success toast if requested
        if (hooksOps.showSuccessToast) {
          toast.success(
            typeof hooksOps.showSuccessToast === 'string'
              ? hooksOps.showSuccessToast
              : 'הפעולה בוצעה בהצלחה!'
          );
        }

        return result as T;
      } catch (err: any) {
        setError(err.message);
        if (hooksOps.onError) hooksOps.onError(err);
        
        // Show automatic error toast if requested
        if (hooksOps.showErrorToast) {
          toast.error(
            typeof hooksOps.showErrorToast === 'string'
              ? hooksOps.showErrorToast
              : err.message
          );
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { execute, data, isLoading, error };
}
