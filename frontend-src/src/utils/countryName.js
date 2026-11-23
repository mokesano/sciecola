/**
 * Nama negara dari kode ISO 3166-1 alpha-2 (mis. "ID" → "Indonesia"), sesuai bahasa UI.
 * Nilai yang bukan kode dua huruf (data lama berupa nama negara) dikembalikan apa adanya.
 */
const cache = new Map();

export function countryName(value, lang = 'id') {
  if (!value) return '';
  const v = String(value).trim();
  if (!/^[A-Za-z]{2}$/.test(v)) return v;
  const key = `${lang}:${v.toUpperCase()}`;
  if (cache.has(key)) return cache.get(key);
  let name = v.toUpperCase();
  try {
    name = new Intl.DisplayNames([lang, 'en'], { type: 'region' }).of(v.toUpperCase()) || name;
  } catch { /* browser lama: tampilkan kode */ }
  cache.set(key, name);
  return name;
}

export default countryName;
