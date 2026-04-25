const { createOAuthState, consumeOAuthState: consumeState } = require("./oauthStateService");

const META_AUTH_URL = "https://www.facebook.com/v23.0/dialog/oauth";
const META_TOKEN_URL = "https://graph.facebook.com/v23.0/oauth/access_token";
const META_ME_ACCOUNTS_URL = "https://graph.facebook.com/v23.0/me/accounts";

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in .env`);
  return value;
};

const buildMetaAuthUrl = (userId, provider) => {
  const clientId = requiredEnv("META_APP_ID");
  const redirectUri = requiredEnv("META_REDIRECT_URI");
  const state = createOAuthState({ userId, provider });

  const scopeByProvider = {
    Facebook: "pages_show_list pages_read_engagement pages_manage_posts",
    Instagram: "pages_show_list pages_read_engagement instagram_basic instagram_content_publish"
  };

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
    scope: scopeByProvider[provider]
  });

  return `${META_AUTH_URL}?${params.toString()}`;
};

const consumeMetaOAuthState = (state) => {
  const payload = consumeState(state);
  if (!payload || !["Facebook", "Instagram"].includes(payload.provider)) return null;
  return payload;
};

const exchangeCodeForMetaUserToken = async (code) => {
  const appId = requiredEnv("META_APP_ID");
  const appSecret = requiredEnv("META_APP_SECRET");
  const redirectUri = requiredEnv("META_REDIRECT_URI");

  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code
  });

  const response = await fetch(`${META_TOKEN_URL}?${params.toString()}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Meta token exchange failed: ${JSON.stringify(data)}`);
  }
  return data;
};

const exchangeForLongLivedMetaToken = async (shortLivedToken) => {
  const appId = requiredEnv("META_APP_ID");
  const appSecret = requiredEnv("META_APP_SECRET");

  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLivedToken
  });

  const response = await fetch(`${META_TOKEN_URL}?${params.toString()}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Meta long-lived token exchange failed: ${JSON.stringify(data)}`);
  }
  return data;
};

const fetchMetaPages = async (userAccessToken) => {
  const params = new URLSearchParams({
    fields: "id,name,access_token,instagram_business_account{id,username}",
    access_token: userAccessToken
  });

  const response = await fetch(`${META_ME_ACCOUNTS_URL}?${params.toString()}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Meta pages fetch failed: ${JSON.stringify(data)}`);
  }
  return data.data || [];
};

module.exports = {
  buildMetaAuthUrl,
  consumeMetaOAuthState,
  exchangeCodeForMetaUserToken,
  exchangeForLongLivedMetaToken,
  fetchMetaPages
};
