import frontendConfig from './frontend-src/vite.config.js';

export default (env) => {
  const resolved =
    typeof frontendConfig === 'function' ? frontendConfig(env) : frontendConfig;

  return {
    ...resolved,
    root: 'frontend-src',
  };
};