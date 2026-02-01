import { useState, useEffect } from 'react';
import Chessboard from './components/Chessboard';
import './index.css';

const API_BASE = 'http://localhost:3001';

interface GameState {
  id: string;
  whitePlayerId: string;
  blackPlayerId: string;
  status: string;
  winnerId: string | null;
  state: {
    fen: string;
    turn: 'w' | 'b';
    isCheck: boolean;
    isCheckmate: boolean;
    isDraw: boolean;
    isGameOver: boolean;
  };
}

interface User {
  id: string;
  username: string;
}

function App() {
  const [game, setGame] = useState<GameState | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (game && game.status === 'ongoing') {
      interval = setInterval(() => {
        pollGameState(game.id);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [game?.id, game?.status]);

  const fetchUsers = async () => {
    const res = await fetch(`${API_BASE}/users`);
    const data = await res.json();
    setUsers(data);
  };

  const createUser = async (username: string) => {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    fetchUsers();
    setCurrentUser(data);
  };

  const createGame = async (whiteId: string, blackId: string) => {
    const res = await fetch(`${API_BASE}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whitePlayerId: whiteId, blackPlayerId: blackId }),
    });
    const data = await res.json();
    setGame(data);
    pollGameState(data.id);
  };

  const pollGameState = async (id: string) => {
    const res = await fetch(`${API_BASE}/games/${id}`);
    const data = await res.json();
    setGame(data);
  };

  const handleMove = async (from: string, to: string) => {
    if (!game || !currentUser) return;

    try {
      const res = await fetch(`${API_BASE}/games/${game.id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: currentUser.id,
          from,
          to,
          promotion: 'q', // Default to queen for now
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setGame({ ...game, ...data });
        setError(null);
      }
    } catch (err) {
      setError('Failed to submit move');
    }
  };

  return (
    <div className="App">
      <h1>Chess Master</h1>

      {!currentUser ? (
        <div className="user-setup">
          <h2>Select or Create User</h2>
          <div className="user-list">
            {users.map(u => (
              <button key={u.id} onClick={() => setCurrentUser(u)}>{u.username}</button>
            ))}
          </div>
          <input
            type="text"
            placeholder="New username"
            onKeyDown={(e) => {
              if (e.key === 'Enter') createUser(e.currentTarget.value);
            }}
          />
        </div>
      ) : (
        <div className="game-area">
          <p>Logged in as: <strong>{currentUser.username}</strong></p>

          {!game ? (
            <div className="game-setup">
              <h3>Start New Game</h3>
              <select id="opponent">
                {users.filter(u => u.id !== currentUser.id).map(u => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
              <button onClick={() => {
                const opponentId = (document.getElementById('opponent') as HTMLSelectElement).value;
                createGame(currentUser.id, opponentId);
              }}>
                Play as White
              </button>
              <button onClick={() => {
                const opponentId = (document.getElementById('opponent') as HTMLSelectElement).value;
                createGame(opponentId, currentUser.id);
              }}>
                Play as Black
              </button>
            </div>
          ) : (
            <>
              <Chessboard
                fen={game.state.fen}
                onMove={handleMove}
                turn={game.state.turn}
                isGameOver={game.state.isGameOver}
              />

              <div className="game-info">
                <div className="status">
                  {game.status === 'ongoing' ? (
                    <span>Turn: {game.state.turn === 'w' ? 'White' : 'Black'}</span>
                  ) : (
                    <span>Game Over: {game.status} (Winner: {users.find(u => u.id === game.winnerId)?.username || 'Draw'})</span>
                  )}
                </div>
                {error && <div className="error" style={{ color: 'red' }}>{error}</div>}
                <button onClick={() => setGame(null)}>Back to Menu</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
