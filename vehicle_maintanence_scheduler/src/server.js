require("../../shared-env");

const http = require("node:http");
const { Log } = require("../../logger_middleware/src");
const { HOST, PORT } = require("./config");
const { buildMaintenanceSchedule } = require("./scheduler-service");

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify(body, null, 2));
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "GET" && url.pathname === "/health") {
    await Log("backend", "debug", "handler", "Health check requested for vehicle scheduler");
    return sendJson(response, 200, { status: "ok" });
  }

  if (request.method === "GET" && url.pathname === "/schedule") {
    try {
      await Log("backend", "info", "handler", "Received maintenance schedule request");
      const data = await buildMaintenanceSchedule();
      return sendJson(response, 200, data);
    } catch (error) {
      await Log("backend", "error", "handler", `Maintenance schedule request failed: ${error.message}`);
      return sendJson(response, 500, {
        error: "SCHEDULE_COMPUTATION_FAILED",
        message: error.message,
      });
    }
  }

  await Log("backend", "warn", "handler", `Unhandled route ${request.method} ${url.pathname}`);
  return sendJson(response, 404, { error: "NOT_FOUND" });
});

server.listen(PORT, HOST, async () => {
  await Log("backend", "info", "config", `Vehicle scheduler service started on ${HOST}:${PORT}`);
});
