namespace GameServer.Domain.Entities
{
    public class Player
    {
        public string PlayerId { get; set; } = default!;
        public string ConnectionId { get; set; } = default!;
        public string PlayerName { get; set; } = default!;
        public List<Card> Hand { get; set; } = new(); 
        public List<Stack<Card>> CapturePiles { get; set; } = new();
        public int Score { get; set; }
    }
}
