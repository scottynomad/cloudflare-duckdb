import { Container as PkgContainer } from '@cloudflare/containers';

interface EnvWithCustomVariables extends Env {
  API_TOKEN: string;
  R2_TOKEN: string;
  R2_ENDPOINT: string;
  R2_CATALOG: string;
}

export class Container extends PkgContainer<EnvWithCustomVariables> {
  constructor(ctx: any, env: EnvWithCustomVariables) {
    super(ctx, env);

    let envConfig: Record<string, string> = {};

    // Add API token if provided
    if (env.API_TOKEN) {
      envConfig = {
        ...envConfig,
        API_TOKEN: env.API_TOKEN,
      };
    }
    // Add R2 Data Catalog credentials if provided -> For Iceberg to work
    if (env.R2_TOKEN && env.R2_ENDPOINT && env.R2_CATALOG) {
      envConfig = {
        ...envConfig,
        R2_TOKEN: env.R2_TOKEN,
        R2_ENDPOINT: env.R2_ENDPOINT,
        R2_CATALOG: env.R2_CATALOG,
      };
    }

    this.defaultPort = 3000;
    this.sleepAfter = '3m';
    this.enableInternet = true;
    this.envVars = envConfig;
  }
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    try {
      return await env.CONTAINER.get(env.CONTAINER.idFromName('cloudflare-duckdb')).fetch(request);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error fetch:', err.message);
        return new Response(err.message, { status: 500 });
      }
      return new Response('Unknown error', { status: 500 });
    }
  },
};
