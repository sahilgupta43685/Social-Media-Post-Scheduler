const requireEnv = (name) => {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
};

const validateCommonEnv = () => {
  requireEnv("MONGO_URI");
  requireEnv("JWT_SECRET");
  requireEnv("REDIS_URL");
};

module.exports = {
  validateCommonEnv
};
