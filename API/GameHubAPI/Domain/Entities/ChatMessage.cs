namespace GameServer.Domain.Entities
{
    public class ChatMessage
    {
        public string UserId { get; set; } = default!;
        public string PlayerName { get; set; } = default!;
        public string Message { get; set; } = default!;
        public DateTime Timestamp { get; set; }
    }
}
