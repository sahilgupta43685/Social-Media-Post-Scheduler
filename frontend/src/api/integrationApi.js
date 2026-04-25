import client from "./client";

export const getLinkedInAuthUrl = async () => {
  const res = await client.get("/integrations/linkedin/auth-url");
  return res.data;
};

export const getLinkedInStatus = async () => {
  const res = await client.get("/integrations/linkedin/status");
  return res.data;
};

export const disconnectLinkedIn = async () => {
  const res = await client.delete("/integrations/linkedin/disconnect");
  return res.data;
};

export const getXAuthUrl = async () => {
  const res = await client.get("/integrations/x/auth-url");
  return res.data;
};

export const getXStatus = async () => {
  const res = await client.get("/integrations/x/status");
  return res.data;
};

export const disconnectX = async () => {
  const res = await client.delete("/integrations/x/disconnect");
  return res.data;
};

export const getMetaAuthUrl = async (provider) => {
  const res = await client.get(`/integrations/${provider}/auth-url`);
  return res.data;
};

export const getProviderStatus = async (provider) => {
  const res = await client.get(`/integrations/${provider}/status`);
  return res.data;
};

export const disconnectProvider = async (provider) => {
  const res = await client.delete(`/integrations/${provider}/disconnect`);
  return res.data;
};
