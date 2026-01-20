using GameServer.Domain.Entities;

namespace GameServer.Application.Interfaces
{
    public interface IChatService
    {
        ChatMessage CreateMessage(
            string gameId,
            string userId,
            string message
        );
    }
}
