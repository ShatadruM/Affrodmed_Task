const { Log } = require("../../logger_middleware/src");

async function getJson(url, packageName) {
  const token = process.env.ACCESS_TOKEN;
  if (!token) {
    await Log("backend", "error", "auth", `Missing ACCESS_TOKEN while requesting ${url}`);
    throw new Error("ACCESS_TOKEN is required");
  }

  await Log("backend", "debug", packageName, `Sending GET request to ${url}`);
  const startedAt = Date.now();
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const elapsedMs = Date.now() - startedAt;
  if (!response.ok) {
    await Log("backend", "error", packageName, `GET ${url} failed with status ${response.status} after ${elapsedMs}ms`);
    throw new Error(`Request failed with status ${response.status}`);
  }

  await Log("backend", "info", packageName, `GET ${url} succeeded in ${elapsedMs}ms`);
  return response.json();
}

module.exports = { getJson };

