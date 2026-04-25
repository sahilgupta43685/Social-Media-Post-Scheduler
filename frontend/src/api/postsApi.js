import client from "./client";

export const getPosts = async (status = "all") => {
  const params = status === "all" ? {} : { status };
  const res = await client.get("/posts", { params });
  return res.data;
};

export const createPost = async (payload) => {
  const res = await client.post("/posts", payload);
  return res.data;
};

export const updatePost = async (id, payload) => {
  const res = await client.put(`/posts/${id}`, payload);
  return res.data;
};

export const deletePost = async (id) => {
  const res = await client.delete(`/posts/${id}`);
  return res.data;
};

export const retryPost = async (id) => {
  const res = await client.post(`/posts/${id}/retry`);
  return res.data;
};
