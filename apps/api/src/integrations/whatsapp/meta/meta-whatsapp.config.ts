export interface MetaPlatformConfig {
  appId: string;
  appSecret: string;
  embeddedSignupConfigId: string;
  graphApiVersion: string;
  webhookVerifyToken: string;
}

/**
 * Reads Meta Tech Provider credentials from environment (platform-owned Meta app).
 */
export function getMetaPlatformConfig(): MetaPlatformConfig | null {
  const appId = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();
  const embeddedSignupConfigId = process.env.META_EMBEDDED_SIGNUP_CONFIG_ID?.trim();

  if (!appId || !appSecret || !embeddedSignupConfigId) {
    return null;
  }

  return {
    appId,
    appSecret,
    embeddedSignupConfigId,
    graphApiVersion: process.env.META_GRAPH_API_VERSION?.trim() || 'v22.0',
    webhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN?.trim() || '',
  };
}

/**
 * Returns public Embedded Signup settings for the web client.
 */
export function getMetaEmbeddedSignupPublicConfig() {
  const config = getMetaPlatformConfig();
  if (!config) {
    return null;
  }

  return {
    appId: config.appId,
    configId: config.embeddedSignupConfigId,
    graphApiVersion: config.graphApiVersion,
  };
}
