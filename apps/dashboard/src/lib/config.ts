/** Runtime configuration (public env, baked at build by Next). */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? 'demo';

export const CLUSTER_NAME = process.env.NEXT_PUBLIC_CLUSTER ?? 'kind-devforge';
