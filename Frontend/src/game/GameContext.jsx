import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { buildGameHubConnection } from "../services/hubConnectionFactory";
import { startHubConnection } from "../services/startHubConnection";
import { getOrCreateUserId } from "../services/userIdentity";

const GameContext = createContext(null);

export function GameProvider({ children }) {
  //const baseUrl = "https://localhost:7027";
  //const baseUrl = "http://172.16.105.172:7027";
  const baseUrl = "http://192.168.100.98:7027";
  //const baseUrl = "http://192.168.18.196:7027";
  //const baseUrl = "https://hien-unpremature-nikia.ngrok-free.dev";
  const userId = useMemo(() => getOrCreateUserId(), []);

  const connectionRef = useRef(null);

  const [hubState, setHubState] = useState({
    status: "idle",
    connectionId: null,
    lastError: null
  });

  const [gameState, setGameState] = useState({
    activeGameId: null,
    createdGameId: null,
    game: null
  });

  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    const conn = buildGameHubConnection({ baseUrl, userId });
    connectionRef.current = conn;

    conn.on("GameCreated", (gameId) => {
      setGameState((s) => ({ ...s, createdGameId: gameId }));
    });

    conn.on("GameUpdated", (game) => {
      setGameState((s) => ({
        ...s,
        game,
        activeGameId: s.activeGameId ?? game?.GameId ?? game?.gameId ?? null
      }));

      setHubState(hs => ({
        ...hs,
        lastError: null
      }));
    });

    conn.on("GameError", (err) => {
      console.error("GameError:", err);

      setHubState(hs => ({
        ...hs,
        lastError: err
      }));
    });

    conn.on("RejoinedGame", async (game) => {
      console.log("Rejoined previous game:", game);

      setGameState({
        activeGameId: game?.GameId ?? game?.gameId ?? null,
        createdGameId: null,
        game: game
      });
    });

    conn.on("ChatMessageReceived", (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    conn.onreconnecting((err) => {
      console.log("[hub] reconnecting...", err);
      setHubState((hs) => ({ ...hs, status: "reconnecting", lastError: err ?? null }));
    });

    conn.onreconnected((newConnectionId) => {
      console.log("[hub] reconnected:", newConnectionId);
      setHubState((hs) => ({ ...hs, status: "connected", connectionId: newConnectionId, lastError: null }));
    });

    conn.onclose((err) => {
      console.log("[hub] closed", err);
      setHubState((hs) => ({ ...hs, status: "disconnected", lastError: err ?? null, connectionId: null }));
    });

    return () => {
      conn.off("GameCreated");
      conn.off("GameUpdated");
      conn.off("ChatMessageReceived");
      conn.stop();
      connectionRef.current = null;
    };
  }, [baseUrl, userId]);

  useEffect(() => {
    const conn = connectionRef.current;
    if (!conn) return;

    let cancelled = false;

    (async () => {
      try {
        setHubState((hs) => ({ ...hs, status: "connecting", lastError: null }));
        await startHubConnection(conn);
        if (cancelled) return;

        setHubState((hs) => ({
          ...hs,
          status: "connected",
          connectionId: conn.connectionId,
          lastError: null
        }));
      } catch (err) {
        if (cancelled) return;
        setHubState((hs) => ({ ...hs, status: "error", lastError: err }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const ensureConnected = useCallback(async () => {
    const conn = connectionRef.current;
    if (!conn) throw new Error("Hub connection not initialized.");
    if (conn.state === "Connected") return conn;
    await startHubConnection(conn);
    return conn;
  }, []);

  const api = useMemo(() => {
    return {
      userId,
      hubState,
      gameState,

      async createGame() {
        const conn = await ensureConnected();
        await conn.invoke("CreateGame");
      },

      async joinGame(gameId, playerName) {
        const conn = await ensureConnected();
        await conn.invoke("JoinGame", gameId, playerName);
        setGameState((s) => ({ ...s, activeGameId: gameId }));
      },

      async startGame(gameId) {
        const conn = await ensureConnected();
        await conn.invoke("StartGame", gameId);
      },

      async drawCard(gameId) {
        const conn = await ensureConnected();
        await conn.invoke("DrawCard", gameId);
      },

      async throwCard(gameId, card) {
        const conn = await ensureConnected();
        await conn.invoke("ThrowCard", gameId, card);
      },

      async leaveGame(gameId) {
        const conn = await ensureConnected();
        await conn.invoke("LeaveGame", gameId);
        setGameState({ activeGameId: null, createdGameId: null, game: null });
        setChatMessages([]);
      },

      chatMessages,
      async sendChatMessage(gameId, message) {
        const conn = await ensureConnected();
        await conn.invoke("SendChatMessage", gameId, message);
      }
    };
  }, [ensureConnected, userId, hubState, gameState, chatMessages]);

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within <GameProvider />");
  return ctx;
}
