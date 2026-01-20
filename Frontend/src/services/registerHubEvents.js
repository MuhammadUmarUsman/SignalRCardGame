export const registerHubEvents = (connection, handlers) => {
    Object.entries(handlers).forEach(([event, fn]) => {
        connection.on(event, fn);
    });
}