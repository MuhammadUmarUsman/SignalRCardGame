export async function startHubConnection(connection, { maxAttempts = 10, delayMs = 1500 } = {}) {
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      if (connection.state === "Connected") return;
      if (connection.state === "Connecting") return;

      await connection.start();
      console.log("[hub] connected:", connection.connectionId);
      return;
    } catch (err) {
      attempt += 1;
      console.warn(`[hub] start failed (attempt ${attempt}/${maxAttempts})`, err);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  throw new Error("Failed to start SignalR connection after multiple attempts.");
}
