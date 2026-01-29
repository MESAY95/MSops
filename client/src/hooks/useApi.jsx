// frontend/src/hooks/useApi.jsx
import { useState, useCallback } from 'react';

export const useApi = (apiFunction) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
};

export const useApiState = (initialState = null) => {
  const [data, setData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startLoading = () => {
    setLoading(true);
    setError(null);
  };

  const stopLoading = () => {
    setLoading(false);
  };

  const setSuccess = (newData) => {
    setData(newData);
    setError(null);
    setLoading(false);
  };

  const setFailed = (errorMessage) => {
    setError(errorMessage);
    setLoading(false);
  };

  const reset = () => {
    setData(initialState);
    setLoading(false);
    setError(null);
  };

  return {
    data,
    loading,
    error,
    setData,
    setLoading,
    setError,
    startLoading,
    stopLoading,
    setSuccess,
    setFailed,
    reset
  };
};
