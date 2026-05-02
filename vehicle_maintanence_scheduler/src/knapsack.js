function normalizeTask(task) {
  const taskId = task.TaskID || task.taskId || task.id || task.ID;
  const duration = Number(task.Duration ?? task.duration);
  const impact = Number(task.Impact ?? task.impact);

  if (!taskId || !Number.isInteger(duration) || !Number.isFinite(impact) || duration <= 0 || impact < 0) {
    throw new Error(`Invalid maintenance task: ${JSON.stringify(task)}`);
  }

  return { taskId, duration, impact };
}

function scheduleTasks(tasks, capacity) {
  const mechanicHours = Number(capacity);
  if (!Number.isInteger(mechanicHours) || mechanicHours < 0) {
    throw new Error("Mechanic hours must be a non-negative integer");
  }

  const normalizedTasks = tasks.map(normalizeTask);
  const dp = Array.from({ length: mechanicHours + 1 }, () => ({
    impact: 0,
    duration: 0,
    selectedTasks: [],
  }));

  for (const task of normalizedTasks) {
    for (let hours = mechanicHours; hours >= task.duration; hours -= 1) {
      const previous = dp[hours - task.duration];
      const candidateImpact = previous.impact + task.impact;
      const candidateDuration = previous.duration + task.duration;

      if (
        candidateImpact > dp[hours].impact ||
        (candidateImpact === dp[hours].impact && candidateDuration < dp[hours].duration)
      ) {
        dp[hours] = {
          impact: candidateImpact,
          duration: candidateDuration,
          selectedTasks: [...previous.selectedTasks, task],
        };
      }
    }
  }

  return {
    selectedTasks: dp[mechanicHours].selectedTasks,
    totalImpact: dp[mechanicHours].impact,
    totalDuration: dp[mechanicHours].duration,
    mechanicHours,
  };
}

module.exports = { scheduleTasks, normalizeTask };

