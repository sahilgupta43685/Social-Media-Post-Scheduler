const crypto = require("crypto");
const { createOAuthState, consumeOAuthState: consumeState } = require("./oauthStateService");

const X_AUTH_URL = "https://x.com/i/oauth2/authorize";
const X_TOKEN_URL = "https://api.x.com/2/oauth2/token";
const X_ME_URL = "https://api.x.com/2/users/me";

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in .env`);
  return value;
};

const buildCodeChallenge = (verifier) => {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
};

const buildXAuthUrl = (userId) => {
  const clientId = requiredEnv("X_CLIENT_ID");
  const redirectUri = requiredEnv("X_REDIRECT_URI");

  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = buildCodeChallenge(codeVerifier);
  const state = createOAuthState({ userId, provider: "X", codeVerifier });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "tweet.read tweet.write users.read offline.access",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256"
  });

  return `${X_AUTH_URL}?${params.toString()}`;
};

const consumeXOAuthState = (state) => {
  const payload = consumeState(state);
  if (!payload || payload.provider !== "X") return null;
  return payload;
};

const exchangeCodeForXToken = async ({ code, codeVerifier }) => {
  const clientId = requiredEnv("X_CLIENT_ID");
  const clientSecret = process.env.X_CLIENT_SECRET;
  const redirectUri = requiredEnv("X_REDIRECT_URI");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier
  });

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded"
  };

  if (clientSecret) {
    headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
  }

  const response = await fetch(X_TOKEN_URL, {
    method: "POST",
    headers,
    body
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`X token exchange failed: ${JSON.stringify(data)}`);
  }

  return data;
};

const refreshXAccessToken = async (refreshToken) => {
  const clientId = requiredEnv("X_CLIENT_ID");
  const clientSecret = process.env.X_CLIENT_SECRET;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId
  });

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded"
  };

  if (clientSecret) {
    headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
  }

  const response = await fetch(X_TOKEN_URL, {
    method: "POST",
    headers,
    body
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`X token refresh failed: ${JSON.stringify(data)}`);
  }

  return data;
};

const fetchXMe = async (accessToken) => {
  const response = await fetch(X_ME_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`X user fetch failed: ${JSON.stringify(data)}`);
  }

  return data.data;
};

module.exports = {
  buildXAuthUrl,
  consumeXOAuthState,
  exchangeCodeForXToken,
  refreshXAccessToken,
  fetchXMe
};
