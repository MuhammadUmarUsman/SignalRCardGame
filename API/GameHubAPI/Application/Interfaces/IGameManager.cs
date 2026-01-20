using GameServer.Domain.Entities;

namespace GameServer.Application.Interfaces
{
    public interface IGameManager
    {
        Game CreateGame(string hostPlayerId);
        void JoinGame(string gameId, Player player);
        void LeaveGame(string gameId, string userId);
        void StartGame(string gameId, string userId);

        //void DrawCard(string gameId, string playerId);
        void ThrowCard(string gameId, string playerId, Card card);

        Game GetGame(string gameId);
        void CalculateScores(string gameId);
        string? GetUserGame(string userId);
    }

}
