const assert = require("node:assert/strict");
const { scheduleTasks } = require("./knapsack");

const result = scheduleTasks(
  [
    { TaskID: "quick-fix", Duration: 1, Impact: 1 },
    { TaskID: "brake-service", Duration: 3, Impact: 7 },
    { TaskID: "engine-repair", Duration: 4, Impact: 9 },
    { TaskID: "inspection", Duration: 2, Impact: 4 },
  ],
  5
);

assert.equal(result.totalImpact, 11);
assert.equal(result.totalDuration, 5);
assert.deepEqual(result.selectedTasks.map((task) => task.taskId).sort(), ["brake-service", "inspection"]);

