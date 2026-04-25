const LinkedInAccount = require("../models/LinkedInAccount");
const SocialAccount = require("../models/SocialAccount");
const {
  buildLinkedInAuthUrl,
  consumeOAuthState: consumeLinkedInState,
  exchangeCodeForToken,
  fetchLinkedInUserInfo
} = require("../services/linkedinOAuthService");
const { upsertLinkedInTokens } = require("../services/linkedinAccountService");
const {
  buildXAuthUrl,
  consumeXOAuthState,
  exchangeCodeForXToken,
  fetchXMe
} = require("../services/xOAuthService");
const {
  buildMetaAuthUrl,
  consumeMetaOAuthState,
  exchangeCodeForMetaUserToken,
  exchangeForLongLivedMetaToken,
  fetchMetaPages
} = require("../services/metaOAuthService");
const { upsertSocialTokens } = require("../services/socialAccountService");

const redirectWithProviderState = (providerKey, state, reason = "") => {
  const params = new URLSearchParams();
  params.set(providerKey, state);
  if (reason) params.set("reason", reason);
  return `${process.env.FRONTEND_URL}/?${params.toString()}`;
};

const getLinkedInAuthUrl = async (req, res) => {
  try {
    const url = buildLinkedInAuthUrl(req.user.id);
    return res.status(200).json({ url });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const linkedInCallback = async (req, res) => {
  try {
    const { code, state, error, error_description: errorDescription } = req.query;

    if (error) {
      return res.redirect(
        redirectWithProviderState("linkedin", "error", encodeURIComponent(errorDescription || error))
      );
    }

    if (!code || !state) {
      return res.status(400).json({ message: "Missing code/state" });
    }

    const userId = consumeLinkedInState(state);
    if (!userId) {
      return res.status(400).json({ message: "Invalid or expired OAuth state" });
    }

    const tokenData = await exchangeCodeForToken(code);
    const userInfo = await fetchLinkedInUserInfo(tokenData.access_token);

    const linkedinMemberId = userInfo.sub;
    const authorUrn = `urn:li:person:${linkedinMemberId}`;
    let account = await LinkedInAccount.findOne({ user: userId });
    if (!account) {
      account = new LinkedInAccount({
        user: userId,
        linkedinMemberId,
        authorUrn
      });
    }

    account.linkedinMemberId = linkedinMemberId;
    account.authorUrn = authorUrn;
    account.needsReconnect = false;
    account.lastPublishError = null;
    await upsertLinkedInTokens(account, tokenData);
    await account.save();

    return res.redirect(redirectWithProviderState("linkedin", "connected"));
  } catch (error) {
    return res.redirect(redirectWithProviderState("linkedin", "error", encodeURIComponent(error.message)));
  }
};

const getLinkedInStatus = async (req, res) => {
  try {
    const account = await LinkedInAccount.findOne({ user: req.user.id });
    if (!account) {
      return res.status(200).json({ connected: false });
    }

    return res.status(200).json({
      connected: true,
      authorUrn: account.authorUrn,
      expiresAt: account.expiresAt,
      scope: account.scope,
      needsReconnect: account.needsReconnect,
      lastRefreshAt: account.lastRefreshAt,
      lastPublishAt: account.lastPublishAt,
      lastPublishError: account.lastPublishError
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const disconnectLinkedIn = async (req, res) => {
  try {
    await LinkedInAccount.findOneAndDelete({ user: req.user.id });
    return res.status(200).json({ message: "LinkedIn disconnected" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getXAuthUrl = async (req, res) => {
  try {
    const url = buildXAuthUrl(req.user.id);
    return res.status(200).json({ url });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const xCallback = async (req, res) => {
  try {
    const { code, state, error, error_description: errorDescription } = req.query;

    if (error) {
      return res.redirect(
        redirectWithProviderState("x", "error", encodeURIComponent(errorDescription || error))
      );
    }

    if (!code || !state) {
      return res.status(400).json({ message: "Missing code/state" });
    }

    const oauthState = consumeXOAuthState(state);
    if (!oauthState) {
      return res.status(400).json({ message: "Invalid or expired OAuth state" });
    }

    const tokenData = await exchangeCodeForXToken({
      code,
      codeVerifier: oauthState.codeVerifier
    });
    const me = await fetchXMe(tokenData.access_token);

    let account = await SocialAccount.findOne({ user: oauthState.userId, provider: "X" });
    if (!account) {
      account = new SocialAccount({
        user: oauthState.userId,
        provider: "X",
        providerAccountId: me.id
      });
    }

    account.providerAccountId = me.id;
    account.displayName = me.username || me.name || "X account";
    account.needsReconnect = false;
    account.lastPublishError = null;
    upsertSocialTokens(account, tokenData);
    await account.save();

    return res.redirect(redirectWithProviderState("x", "connected"));
  } catch (error) {
    return res.redirect(redirectWithProviderState("x", "error", encodeURIComponent(error.message)));
  }
};

const getXStatus = async (req, res) => {
  try {
    const account = await SocialAccount.findOne({ user: req.user.id, provider: "X" });
    if (!account) return res.status(200).json({ connected: false });

    return res.status(200).json({
      connected: true,
      accountId: account.providerAccountId,
      displayName: account.displayName,
      expiresAt: account.expiresAt,
      scope: account.scope,
      needsReconnect: account.needsReconnect,
      lastRefreshAt: account.lastRefreshAt,
      lastPublishAt: account.lastPublishAt,
      lastPublishError: account.lastPublishError
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const disconnectX = async (req, res) => {
  try {
    await SocialAccount.findOneAndDelete({ user: req.user.id, provider: "X" });
    return res.status(200).json({ message: "X disconnected" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getMetaAuthUrl = async (req, res) => {
  try {
    const { provider } = req.params;
    if (!["facebook", "instagram"].includes(provider)) {
      return res.status(400).json({ message: "Unsupported provider" });
    }

    const providerName = provider === "facebook" ? "Facebook" : "Instagram";
    const url = buildMetaAuthUrl(req.user.id, providerName);
    return res.status(200).json({ url });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const metaCallback = async (req, res) => {
  try {
    const { code, state, error, error_description: errorDescription } = req.query;

    if (error) {
      return res.redirect(
        redirectWithProviderState("meta", "error", encodeURIComponent(errorDescription || error))
      );
    }

    if (!code || !state) {
      return res.status(400).json({ message: "Missing code/state" });
    }

    const oauthState = consumeMetaOAuthState(state);
    if (!oauthState) {
      return res.status(400).json({ message: "Invalid or expired OAuth state" });
    }

    const shortTokenData = await exchangeCodeForMetaUserToken(code);
    let tokenData = shortTokenData;
    try {
      tokenData = await exchangeForLongLivedMetaToken(shortTokenData.access_token);
      if (!tokenData.scope && shortTokenData.scope) {
        tokenData.scope = shortTokenData.scope;
      }
    } catch {
      // If long-lived exchange fails, keep short-lived token path.
    }

    const pages = await fetchMetaPages(tokenData.access_token);
    const page = pages[0];
    if (!page?.access_token || !page?.id) {
      throw new Error("No Facebook page found. Connect a page first in Meta.");
    }

    if (oauthState.provider === "Facebook") {
      let account = await SocialAccount.findOne({ user: oauthState.userId, provider: "Facebook" });
      if (!account) {
        account = new SocialAccount({
          user: oauthState.userId,
          provider: "Facebook",
          providerAccountId: page.id
        });
      }

      account.providerAccountId = page.id;
      account.displayName = page.name || "Facebook Page";
      account.metadata = { pageId: page.id };
      account.needsReconnect = false;
      account.lastPublishError = null;
      upsertSocialTokens(account, {
        ...tokenData,
        access_token: page.access_token
      });
      await account.save();

      return res.redirect(redirectWithProviderState("facebook", "connected"));
    }

    const ig = page.instagram_business_account;
    if (!ig?.id) {
      throw new Error("No Instagram business account linked to your Facebook page.");
    }

    let account = await SocialAccount.findOne({ user: oauthState.userId, provider: "Instagram" });
    if (!account) {
      account = new SocialAccount({
        user: oauthState.userId,
        provider: "Instagram",
        providerAccountId: ig.id
      });
    }

    account.providerAccountId = ig.id;
    account.displayName = ig.username || "Instagram account";
    account.metadata = {
      pageId: page.id,
      igUserId: ig.id
    };
    account.needsReconnect = false;
    account.lastPublishError = null;
    upsertSocialTokens(account, {
      ...tokenData,
      access_token: page.access_token
    });
    await account.save();

    return res.redirect(redirectWithProviderState("instagram", "connected"));
  } catch (error) {
    return res.redirect(redirectWithProviderState("meta", "error", encodeURIComponent(error.message)));
  }
};

const getProviderStatus = async (req, res) => {
  try {
    const { provider } = req.params;
    const providerMap = {
      facebook: "Facebook",
      instagram: "Instagram"
    };

    const providerName = providerMap[provider];
    if (!providerName) {
      return res.status(400).json({ message: "Unsupported provider" });
    }

    const account = await SocialAccount.findOne({ user: req.user.id, provider: providerName });
    if (!account) return res.status(200).json({ connected: false });

    return res.status(200).json({
      connected: true,
      accountId: account.providerAccountId,
      displayName: account.displayName,
      expiresAt: account.expiresAt,
      scope: account.scope,
      needsReconnect: account.needsReconnect,
      lastRefreshAt: account.lastRefreshAt,
      lastPublishAt: account.lastPublishAt,
      lastPublishError: account.lastPublishError,
      metadata: account.metadata || {}
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const disconnectProvider = async (req, res) => {
  try {
    const { provider } = req.params;
    const providerMap = {
      facebook: "Facebook",
      instagram: "Instagram"
    };

    const providerName = providerMap[provider];
    if (!providerName) {
      return res.status(400).json({ message: "Unsupported provider" });
    }

    await SocialAccount.findOneAndDelete({ user: req.user.id, provider: providerName });
    return res.status(200).json({ message: `${providerName} disconnected` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLinkedInAuthUrl,
  linkedInCallback,
  getLinkedInStatus,
  disconnectLinkedIn,
  getXAuthUrl,
  xCallback,
  getXStatus,
  disconnectX,
  getMetaAuthUrl,
  metaCallback,
  getProviderStatus,
  disconnectProvider
};
