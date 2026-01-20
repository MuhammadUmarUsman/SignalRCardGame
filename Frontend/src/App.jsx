import "./App.css";
import { GameProvider } from "./game/GameContext";
import Lobby from "./screens/Lobby"

export default function App() {
  return (
    <GameProvider>
      <div className="app-container">
        <Lobby />
      </div>
    </GameProvider>
  );
}
