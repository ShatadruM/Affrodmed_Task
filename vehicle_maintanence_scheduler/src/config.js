const BASE_URL = process.env.EVALUATION_BASE_URL || "http://20.207.122.201/evaluation-service";

module.exports = {
  BASE_URL,
  DEPOTS_URL: `${BASE_URL}/depots`,
  VEHICLES_URL: `${BASE_URL}/vehicles`,
  HOST: process.env.HOST || "127.0.0.1",
  PORT: Number(process.env.PORT || 3000),
};
