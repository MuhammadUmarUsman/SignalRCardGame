using GameServer.Domain.Enums;

namespace GameServer.Domain.Entities
{
    public class Card
    {
        public Rank Rank { get; set; }
        public Suit Suit { get; set; }
    }
}
