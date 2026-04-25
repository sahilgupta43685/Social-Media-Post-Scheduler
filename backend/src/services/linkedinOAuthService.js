const { createOAuthState, consumeOAuthState: consumeState } = require("./oauthStateService");

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in .env`);
  return value;
};

const buildLinkedInAuthUrl = (userId) => {
  const clientId = requiredEnv("LINKEDIN_CLIENT_ID");
  const redirectUri = requiredEnv("LINKEDIN_REDIRECT_URI");

  const state = createOAuthState({ userId, provider: "LinkedIn" });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "openid profile email w_member_social"
  });

  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
};

const exchangeCodeForToken = async (code) => {
  const clientId = requiredEnv("LINKEDIN_CLIENT_ID");
  const clientSecret = requiredEnv("LINKEDIN_CLIENT_SECRET");
  const redirectUri = requiredEnv("LINKEDIN_REDIRECT_URI");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret
  });

  const response = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`LinkedIn token exchange failed: ${JSON.stringify(data)}`);
  }

  return data;
};

const refreshAccessToken = async (refreshToken) => {
  const clientId = requiredEnv("LINKEDIN_CLIENT_ID");
  const clientSecret = requiredEnv("LINKEDIN_CLIENT_SECRET");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret
  });

  const response = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`LinkedIn token refresh failed: ${JSON.stringify(data)}`);
  }

  return data;
};

const fetchLinkedInUserInfo = async (accessToken) => {
  const response = await fetch(LINKEDIN_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`LinkedIn userinfo failed: ${JSON.stringify(data)}`);
  }

  return data;
};

module.exports = {
  buildLinkedInAuthUrl,
  consumeOAuthState: (state) => {
    const payload = consumeState(state);
    if (!payload || payload.provider !== "LinkedIn") return null;
    return payload.userId;
  },
  exchangeCodeForToken,
  refreshAccessToken,
  fetchLinkedInUserInfo
};
