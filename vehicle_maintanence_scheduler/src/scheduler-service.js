const { Log } = require("../../logger_middleware/src");
const { DEPOTS_URL, VEHICLES_URL } = require("./config");
const { getJson } = require("./http-client");
const { scheduleTasks } = require("./knapsack");

function extractDepots(payload) {
  return payload.depots || payload.Depots || [];
}

function extractVehicles(payload) {
  return payload.vehicles || payload.Vehicles || payload.tasks || payload.Tasks || [];
}

function tasksForDepot(vehicles, depotId) {
  const depotSpecificTasks = vehicles.filter((vehicle) => {
    const vehicleDepotId = vehicle.DepotID ?? vehicle.depotId ?? vehicle.depot_id;
    return vehicleDepotId !== undefined && String(vehicleDepotId) === String(depotId);
  });

  return depotSpecificTasks.length > 0 ? depotSpecificTasks : vehicles;
}

async function buildMaintenanceSchedule() {
  await Log("backend", "info", "service", "Starting maintenance schedule computation");

  const [depotPayload, vehiclePayload] = await Promise.all([
    getJson(DEPOTS_URL, "service"),
    getJson(VEHICLES_URL, "service"),
  ]);

  const depots = extractDepots(depotPayload);
  const vehicles = extractVehicles(vehiclePayload);
  await Log("backend", "info", "service", `Fetched ${depots.length} depots and ${vehicles.length} maintenance tasks`);

  const schedules = depots.map((depot) => {
    const depotId = depot.ID ?? depot.id;
    const mechanicHours = depot.MechanicHours ?? depot.mechanicHours;
    const schedule = scheduleTasks(tasksForDepot(vehicles, depotId), mechanicHours);
    return {
      depotId,
      mechanicHours: schedule.mechanicHours,
      totalDuration: schedule.totalDuration,
      totalImpact: schedule.totalImpact,
      selectedTaskCount: schedule.selectedTasks.length,
      selectedTasks: schedule.selectedTasks,
    };
  });

  await Log("backend", "info", "service", `Computed schedules for ${schedules.length} depots`);
  return { schedules };
}

module.exports = { buildMaintenanceSchedule, extractDepots, extractVehicles, tasksForDepot };
