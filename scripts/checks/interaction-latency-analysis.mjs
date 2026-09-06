/** Keep startup visible in the report without attributing it to a later input.
 * A task crossing the boundary still blocks the input and must fail its gate. */
export function partitionLongTasks(tasks, interactionStart) {
  const startupLongTasks = [];
  const interactionLongTasks = [];
  for (const task of tasks) {
    if (task.startTime + task.duration > interactionStart) interactionLongTasks.push(task);
    else startupLongTasks.push(task);
  }
  return { startupLongTasks, interactionLongTasks };
}

