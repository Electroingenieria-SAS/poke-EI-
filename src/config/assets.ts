const BASE = import.meta.env.BASE_URL;
export const asset = (path: string) => `${BASE}assets/fantasy/${path}`;
export const dataFile = (name: string) => `${BASE}data/${name}`;
