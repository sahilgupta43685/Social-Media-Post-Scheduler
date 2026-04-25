import client from "./client";

export const registerUser = async (payload) => {
  const res = await client.post("/auth/register", payload);
  return res.data;
};

export const loginUser = async (payload) => {
  const res = await client.post("/auth/login", payload);
  return res.data;
};
