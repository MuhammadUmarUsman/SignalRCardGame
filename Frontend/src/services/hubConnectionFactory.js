import { HubConnectionBuilder, LogLevel, HttpTransportType } from "@microsoft/signalr";

export function buildGameHubConnection({ baseUrl, userId }) {
  return new HubConnectionBuilder()
    .withUrl(`${baseUrl}/gamehub?userId=${encodeURIComponent(userId)}`, {
      transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
      withCredentials: false
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(LogLevel.Information)
    .build();
}
