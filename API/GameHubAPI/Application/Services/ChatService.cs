using GameServer.Application.Interfaces;
using GameServer.Domain.Entities;

namespace GameServer.Application.Services
{
    public class ChatService : IChatService
    {
        private readonly IGameManager _gameManager;

        public ChatService(IGameManager gameManager)
        {
            _gameManager = gameManager;
        }

        public ChatMessage CreateMessage(
            string gameId,
            string userId,
            string message
        )
        {
            if (string.IsNullOrWhiteSpace(message))
                throw new Exception("Message cannot be empty");

            var game = _gameManager.GetGame(gameId);

            var player = game.Players
                .FirstOrDefault(p => p.PlayerId == userId);

            if (player == null)
                throw new Exception("Player not found in game");

            return new ChatMessage
            {
                UserId = userId,
                PlayerName = player.PlayerName,
                Message = message.Trim(),
                Timestamp = DateTime.UtcNow
            };
        }
    }
}
