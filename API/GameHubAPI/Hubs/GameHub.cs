using GameServer.Application.Interfaces;
using GameServer.Domain.Entities;
using Microsoft.AspNetCore.SignalR;

namespace GameServer.Hubs
{
    public sealed class GameHub : Hub
    {
        private readonly IGameManager _gameManager;
        private readonly IChatService _chatService;

        public GameHub(
            IGameManager gameManager,
            IChatService chatService)
        {
            _gameManager = gameManager;
            _chatService = chatService;
        }

        // ===============================
        // SAFE EXECUTION WRAPPER
        // ===============================

        private async Task SafeExecute(Func<Task> action, string context)
        {
            try
            {
                await action();
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("GameError", new
                {
                    Context = context,
                    Message = ex.Message
                });
            }
        }

        // ===============================
        // HUB METHODS
        // ===============================

        public async Task CreateGame()
        {
            await SafeExecute(async () =>
            {
                var userId = Context.GetHttpContext()?.Request.Query["userId"];
                if (string.IsNullOrWhiteSpace(userId))
                    throw new Exception("User not identified");

                var game = _gameManager.CreateGame(userId);
                await Clients.Caller.SendAsync("GameCreated", game.GameId);

            }, "CreateGame");
        }

        public async Task JoinGame(string gameId, string playerName)
        {
            await SafeExecute(async () =>
            {
                var userId = Context.GetHttpContext()?.Request.Query["userId"];
                if (string.IsNullOrWhiteSpace(userId))
                    throw new Exception("User not identified");

                var player = new Player
                {
                    PlayerId = userId,
                    ConnectionId = Context.ConnectionId,
                    PlayerName = playerName
                };

                _gameManager.JoinGame(gameId, player);
                await Groups.AddToGroupAsync(Context.ConnectionId, gameId);

                await BroadcastState(gameId);

            }, "JoinGame");
        }

        public async Task StartGame(string gameId)
        {
            await SafeExecute(async () =>
            {
                var userId = Context.GetHttpContext()?.Request.Query["userId"];
                _gameManager.StartGame(gameId, userId);

                await BroadcastState(gameId);

            }, "StartGame");
        }

        public async Task ThrowCard(string gameId, Card card)
        {
            await SafeExecute(async () =>
            {
                var userId = Context.GetHttpContext()?.Request.Query["userId"];
                _gameManager.ThrowCard(gameId, userId, card);

                await BroadcastState(gameId);

            }, "ThrowCard");
        }

        public async Task LeaveGame(string gameId)
        {
            await SafeExecute(async () =>
            {
                var userId = Context.GetHttpContext()?.Request.Query["userId"];
                _gameManager.LeaveGame(gameId, userId);

                await Groups.RemoveFromGroupAsync(Context.ConnectionId, gameId);
                await BroadcastState(gameId);

            }, "LeaveGame");
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.GetHttpContext()?.Request.Query["userId"];

            if (!string.IsNullOrWhiteSpace(userId))
            {
                var gameId = _gameManager.GetUserGame(userId);
                if (!string.IsNullOrWhiteSpace(gameId))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, gameId);

                    var game = _gameManager.GetGame(gameId);
                    await Clients.Caller.SendAsync("RejoinedGame", game);
                }
            }

            await base.OnConnectedAsync();
        }

        // ===============================
        // BROADCAST
        // ===============================

        private async Task BroadcastState(string gameId)
        {
            var game = _gameManager.GetGame(gameId);
            await Clients.Group(gameId).SendAsync("GameUpdated", game);
        }

        public async Task SendChatMessage(string gameId, string message)
        {
            await SafeExecute(async () =>
            {
                var userId = Context.GetHttpContext()?.Request.Query["userId"];
                if (string.IsNullOrWhiteSpace(userId))
                    throw new Exception("User not identified");

                var chatMessage = _chatService.CreateMessage(
                    gameId,
                    userId,
                    message
                );

                await Clients.Group(gameId)
                    .SendAsync("ChatMessageReceived", chatMessage);

            }, "SendChatMessage");
        }

    }
}
