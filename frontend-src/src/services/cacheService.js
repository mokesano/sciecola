/**
 * Cache Service - Frontend AJAX wrapper for cache_handler.php
 * Handles ORCID and DOI data fetching with cache-first priority:
 * 1. Cache folder (fastest)
 * 2. Database (cached results)
 * 3. External API (fresh data)
 * 4. Save to cache folder + enqueue for DB
 */

const API_BASE = '/api/cache_handler.php';

/**
 * Fetch researcher profile by ORCID with cache-first strategy
 * @param {string} orcid - ORCID identifier (e.g., "0000-0002-5152-9727")
 * @returns {Promise<Object>} Profile data with _source field indicating data origin
 */
export async function fetchResearcherProfile(orcid) {
  if (!orcid) throw new Error('ORCID identifier required');

  try {
    const response = await fetch(`${API_BASE}?action=fetch&type=orcid&identifier=${encodeURIComponent(orcid)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    if (result.status === 'success') {
      return result.data;
    }
    throw new Error(result.message || 'Unknown error');
  } catch (error) {
    console.error('Failed to fetch researcher profile:', error);
    throw error;
  }
}

/**
 * Fetch article/publication by DOI with cache-first strategy
 * @param {string} doi - DOI identifier (e.g., "10.1234/example")
 * @returns {Promise<Object>} Article data with _source field indicating data origin
 */
export async function fetchArticleByDoi(doi) {
  if (!doi) throw new Error('DOI identifier required');

  try {
    const response = await fetch(`${API_BASE}?action=fetch&type=doi&identifier=${encodeURIComponent(doi)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    if (result.status === 'success') {
      return result.data;
    }
    throw new Error(result.message || 'Unknown error');
  } catch (error) {
    console.error('Failed to fetch article:', error);
    throw error;
  }
}

/**
 * Batch sync cached files to database
 * @param {string} type - Type of data ('orcid' or 'doi')
 * @param {number} limit - Maximum number of files to sync (default: 10)
 * @returns {Promise<number>} Number of records synced
 */
export async function syncCacheToDatabase(type, limit = 10) {
  if (!['orcid', 'doi'].includes(type)) {
    throw new Error('Type must be "orcid" or "doi"');
  }

  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        action: 'sync',
        type: type,
        limit: limit,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    if (result.status === 'success') {
      return result.synced;
    }
    throw new Error(result.message || 'Unknown error');
  } catch (error) {
    console.error('Failed to sync cache to database:', error);
    throw error;
  }
}

/**
 * Get cache folder statistics
 * @param {string} type - Type of data ('orcid', 'doi', or null for all)
 * @returns {Promise<Object>} Cache status with file count, total size, timestamps
 */
export async function getCacheStatus(type = null) {
  try {
    let url = `${API_BASE}?action=status`;
    if (type) {
      url += `&type=${encodeURIComponent(type)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    if (result.status === 'success') {
      return result.cache;
    }
    throw new Error(result.message || 'Unknown error');
  } catch (error) {
    console.error('Failed to get cache status:', error);
    throw error;
  }
}

/**
 * Fetch researcher profile with detailed error handling and logging
 * @param {string} orcid - ORCID identifier
 * @returns {Promise<Object>} Profile data or null
 */
export async function fetchResearcherProfileSafe(orcid) {
  try {
    const data = await fetchResearcherProfile(orcid);
    console.log(`[CACHE] ${orcid} loaded from ${data._source || 'unknown'}`);
    return data;
  } catch (error) {
    console.warn(`[CACHE] Failed to fetch ${orcid}:`, error.message);
    return null;
  }
}

/**
 * Fetch article with detailed error handling and logging
 * @param {string} doi - DOI identifier
 * @returns {Promise<Object>} Article data or null
 */
export async function fetchArticleSafe(doi) {
  try {
    const data = await fetchArticleByDoi(doi);
    console.log(`[CACHE] ${doi} loaded from ${data._source || 'unknown'}`);
    return data;
  } catch (error) {
    console.warn(`[CACHE] Failed to fetch ${doi}:`, error.message);
    return null;
  }
}

/**
 * Get data source origin (useful for debugging)
 * @param {Object} data - Data object with _source field
 * @returns {string} Source name or 'unknown'
 */
export function getDataSource(data) {
  return data?._source || 'unknown';
}

/**
 * Check if data is from cache (not fresh from API)
 * @param {Object} data - Data object with _source field
 * @returns {boolean} True if from cache_folder or database
 */
export function isFromCache(data) {
  return ['cache_folder', 'database'].includes(data?._source);
}

/**
 * Check if data is fresh (directly from external API)
 * @param {Object} data - Data object with _source field
 * @returns {boolean} True if from api
 */
export function isFresh(data) {
  return data?._source === 'api';
}
