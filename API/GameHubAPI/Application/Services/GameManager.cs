using GameServer.Application.Extensions;
using GameServer.Application.Interfaces;
using GameServer.Domain.Entities;
using GameServer.Domain.Enums;

namespace GameServer.Application.Services
{
    public class GameManager : IGameManager
    {
        private readonly Dictionary<string, Game> _games = new();
        private readonly Dictionary<string, string> _userGameMap = new();

        // ===============================
        // GAME LIFECYCLE
        // ===============================

        public Game CreateGame(string hostPlayerId)
        {
            var game = new Game
            {
                GameId = Guid.NewGuid().ToString(),
                HostPlayerId = hostPlayerId
            };

            _games[game.GameId] = game;
            return game;
        }

        public Game GetGame(string gameId)
        {
            if (!_games.ContainsKey(gameId))
                throw new Exception("Game not found");

            return _games[gameId];
        }

        public string? GetUserGame(string userId)
        {
            return _userGameMap.TryGetValue(userId, out var gameId)
                ? gameId
                : null;
        }

        public void JoinGame(string gameId, Player player)
        {
            Game game = GetGame(gameId);

            if (game.IsStarted)
                throw new Exception("Game already started. You cannot join.");

            if (game.Players.Any(p => p.PlayerId == player.PlayerId))
                return;

            if (game.Players.Count >= 4)
                throw new Exception("Room is full");

            game.Players.Add(player);
            _userGameMap[player.PlayerId] = gameId;
        }

        public void LeaveGame(string gameId, string userId)
        {
            if (!_games.ContainsKey(gameId)) return;

            var game = _games[gameId];
            var player = game.Players.FirstOrDefault(p => p.PlayerId == userId);

            if (player != null)
                game.Players.Remove(player);

            _userGameMap.Remove(userId);
        }

        // ===============================
        // GAME START
        // ===============================

        public void StartGame(string gameId, string playerId)
        {
            var game = GetGame(gameId);

            if (game.IsStarted)
                throw new Exception("Game already started");

            if (game.HostPlayerId != playerId)
                throw new Exception("Only the host can start the game");

            game.Deck = CreateDeck();
            game.TableCards.Clear();
            game.HasDrawnThisTurn = false;

            foreach (var p in game.Players)
            {
                p.Hand.Clear();
                p.CapturePiles.Clear();

                for (int i = 0; i < 4; i++)
                    p.Hand.Add(game.Deck.Pop());
            }

            for (int i = 0; i < 4; i++)
                game.TableCards.Add(game.Deck.Pop());

            game.CurrentTurnIndex = Random.Shared.Next(game.Players.Count);
            game.IsStarted = true;

            // Auto-draw for starting player
            AutoDraw(game, game.Players[game.CurrentTurnIndex]);

            CalculateScores(gameId);
        }

        // ===============================
        // THROW CARD (CORE GAME LOGIC)
        // ===============================

        public void ThrowCard(string gameId, string playerId, Card card)
        {
            var game = GetGame(gameId);

            if (!game.IsStarted)
                throw new Exception("Game has not started");

            var player = game.Players.FirstOrDefault(p => p.PlayerId == playerId)
                ?? throw new Exception("Player not found");

            if (game.Players[game.CurrentTurnIndex].PlayerId != playerId)
                throw new Exception("Not your turn");

            var cardInHand = player.Hand.FirstOrDefault(
                c => c.Rank == card.Rank && c.Suit == card.Suit
            );

            if (cardInHand == null)
                throw new Exception("Card not in hand");

            player.Hand.Remove(cardInHand);

            var isEndGamePhase = game.Deck.Count == 0;
            var collected = new List<Card>();

            // ===============================
            // 1️⃣ SELF CAPTURE (top pile only)
            // ===============================
            if (player.CapturePiles.Any())
            {
                var pile = player.CapturePiles.Last();
                while (pile.Any() && pile.Peek().Rank == cardInHand.Rank)
                    collected.Add(pile.Pop());

                if (!pile.Any())
                    player.CapturePiles.Remove(pile);
            }

            // ===============================
            // 2️⃣ TABLE CAPTURE
            // ===============================
            var tableMatches = game.TableCards
                .Where(c => c.Rank == cardInHand.Rank)
                .ToList();

            foreach (var c in tableMatches)
            {
                collected.Add(c);
                game.TableCards.Remove(c);
            }

            // ===============================
            // 3️⃣ STEAL FROM OTHER PLAYERS
            // ===============================
            foreach (var other in game.Players.Where(p => p.PlayerId != playerId))
            {
                if (!other.CapturePiles.Any()) continue;

                var pile = other.CapturePiles.Last();
                while (pile.Any() && pile.Peek().Rank == cardInHand.Rank)
                    collected.Add(pile.Pop());

                if (!pile.Any())
                    other.CapturePiles.Remove(pile);
            }

            // ===============================
            // 4️⃣ RESOLVE CAPTURE
            // ===============================
            if (collected.Any())
            {
                if (!player.CapturePiles.Any())
                    player.CapturePiles.Add(new Stack<Card>());

                var pile = player.CapturePiles.Last();

                pile.Push(cardInHand);      // thrown card first
                collected.ForEach(pile.Push);

                CalculateScores(gameId);

                if (!isEndGamePhase)
                    AutoDraw(game, player);
            }
            else
            {
                // No capture → card stays on table
                game.TableCards.Add(cardInHand);
                CalculateScores(gameId);

                if (!isEndGamePhase)
                {
                    game.CurrentTurnIndex =
                        (game.CurrentTurnIndex + 1) % game.Players.Count;

                    AutoDraw(game, game.Players[game.CurrentTurnIndex]);
                }
            }

            // ===============================
            // ENDGAME TURN RULE
            // ===============================
            if (isEndGamePhase)
            {
                game.CurrentTurnIndex =
                    (game.CurrentTurnIndex + 1) % game.Players.Count;
            }

            // ===============================
            // END GAME CHECK
            // ===============================
            if (game.Deck.Count == 0 &&
                game.Players.All(p => !p.Hand.Any()))
            {
                CalculateScores(gameId);

                game.IsStarted = false;
                game.IsEnded = true;

                ResolveWinners(game);
            }
        }


        // ===============================
        // HELPERS
        // ===============================

        private bool AutoDraw(Game game, Player player)
        {
            if (game.Deck.Count == 0)
                return false;

            player.Hand.Add(game.Deck.Pop());
            game.HasDrawnThisTurn = true;
            return true;
        }

        private Stack<Card> CreateDeck()
        {
            var suits = Enum.GetValues(typeof(Suit)).Cast<Suit>();
            var ranks = Enum.GetValues(typeof(Rank)).Cast<Rank>();

            var deck = suits
                .SelectMany(s => ranks.Select(r => new Card { Suit = s, Rank = r }))
                .ToList();

            deck.Shuffle();
            return new Stack<Card>(deck);
        }

        public void CalculateScores(string gameId)
        {
            var game = GetGame(gameId);

            foreach (var player in game.Players)
            {
                player.Score = player.CapturePiles
                    .SelectMany(p => p)
                    .Sum(c => c.Rank switch
                    {
                        Rank.Ace => 20,
                        Rank.Jack or Rank.Queen or Rank.King or Rank.Ten => 10,
                        _ => 5
                    });
            }
        }

        private void ResolveWinners(Game game)
        {
            var max = game.Players.Max(p => p.Score);
            var winners = game.Players.Where(p => p.Score == max).Select(p => p.PlayerId).ToList();

            game.WinningScore = max;
            game.WinnerPlayerIds = winners;
        }
    }
}
