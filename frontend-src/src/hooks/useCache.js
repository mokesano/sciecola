import { useState, useEffect, useCallback } from 'react';
import * as cacheService from '../services/cacheService';

/**
 * React hook for fetching data with cache-first strategy
 * Automatically handles loading, error states, and retries
 *
 * Usage:
 *   const { data, loading, error, refetch } = useCache('orcid', '0000-0002-5152-9727');
 */
export function useCache(type, identifier) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!type || !identifier) {
      setError('Type and identifier are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result;
      if (type === 'orcid') {
        result = await cacheService.fetchResearcherProfile(identifier);
      } else if (type === 'doi') {
        result = await cacheService.fetchArticleByDoi(identifier);
      } else {
        throw new Error(`Unknown type: ${type}`);
      }

      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      console.error(`Cache fetch error for ${type}/${identifier}:`, err);
    } finally {
      setLoading(false);
    }
  }, [type, identifier]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    data,
    loading,
    error,
    refetch: fetch,
  };
}

/**
 * Hook for syncing cache to database
 * Usage:
 *   const { syncing, syncedCount, syncError, sync } = useSyncCache('orcid', 10);
 */
export function useSyncCache(type = 'orcid', limit = 10) {
  const [syncing, setSyncing] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);
  const [syncError, setSyncError] = useState(null);

  const sync = useCallback(async () => {
    if (!type) {
      setSyncError('Type is required');
      return;
    }

    setSyncing(true);
    setSyncError(null);

    try {
      const count = await cacheService.syncCacheToDatabase(type, limit);
      setSyncedCount(count);
    } catch (err) {
      setSyncError(err.message || 'Failed to sync cache');
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
    }
  }, [type, limit]);

  return {
    syncing,
    syncedCount,
    syncError,
    sync,
  };
}

/**
 * Hook for monitoring cache status
 * Usage:
 *   const { status, loading, error, refresh } = useCacheStatus('orcid');
 */
export function useCacheStatus(type = null) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cacheStatus = await cacheService.getCacheStatus(type);
      setStatus(cacheStatus);
    } catch (err) {
      setError(err.message || 'Failed to fetch cache status');
      console.error('Cache status error:', err);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    status,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook for batch fetching multiple profiles
 * Usage:
 *   const { data, loading, errors } = useCacheBatch('orcid', ['0000-0002-5152-9727', '0000-0001-2345-6789']);
 */
export function useCacheBatch(type, identifiers = []) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!type || identifiers.length === 0) return;

    setLoading(true);
    setErrors({});

    const fetchAll = async () => {
      const results = {};
      const fetchErrors = {};

      for (const identifier of identifiers) {
        try {
          let result;
          if (type === 'orcid') {
            result = await cacheService.fetchResearcherProfile(identifier);
          } else if (type === 'doi') {
            result = await cacheService.fetchArticleByDoi(identifier);
          }
          results[identifier] = result;
        } catch (err) {
          fetchErrors[identifier] = err.message;
          console.warn(`Failed to fetch ${identifier}:`, err.message);
        }
      }

      setData(results);
      setErrors(fetchErrors);
      setLoading(false);
    };

    fetchAll();
  }, [type, identifiers.join(',')]);

  return {
    data,
    loading,
    errors,
  };
}
