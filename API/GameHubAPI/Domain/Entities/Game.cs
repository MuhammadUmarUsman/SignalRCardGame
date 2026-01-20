namespace GameServer.Domain.Entities
{
    public class Game
    {
        public string? GameId { get; set; }
        public List<Player> Players { get; set; } = new(); 
        public List<Card> TableCards { get; set; } = new();
        public Stack<Card> Deck { get; set; } = new();
        public int CurrentTurnIndex { get; set; }
        public bool IsStarted { get; set; } = false;
        public bool HasDrawnThisTurn { get; set; } = false;
        public string HostPlayerId { get; set; }
        public bool IsEnded { get; set; }
        public int WinningScore { get; set; }
        public List<string> WinnerPlayerIds { get; set; } = new();
    }
}
