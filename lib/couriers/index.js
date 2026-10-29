import * as shadowfax from "./shadowfax";
export const PROVIDERS = { shadowfax };
export const providerFor = (name) => PROVIDERS[name] || null;
export const availableProviders = () => Object.entries(PROVIDERS).filter(([, p]) => p.enabled()).map(([k]) => k);
