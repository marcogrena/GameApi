import { WebSocketServer } from 'ws';
import { getGameById } from './db/database.js';
import { getUserByApiKey } from './db/database.js';

// Store active connections: { gameId: [{ ws, userId, username }] }
const gameConnections = new Map();

export const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    // Extract API key from URL query parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    const apiKey = url.searchParams.get('apiKey');
    const gameId = url.searchParams.get('gameId');

    // Validate API key
    if (!apiKey || !gameId) {
      ws.close(4000, 'Missing apiKey or gameId parameter');
      return;
    }

    const user = getUserByApiKey(apiKey);
    if (!user) {
      ws.close(4001, 'Invalid API key');
      return;
    }

    // Verify user is a player or owner of the game
    const game = getGameById(gameId);
    if (!game) {
      ws.close(4002, 'Game not found');
      return;
    }

    const isPlayer = game.players.some(p => p.id === user.id);
    const isOwner = game.ownerId === user.id;
    if (!isPlayer && !isOwner) {
      ws.close(4003, 'Access denied: Not a player or owner of this game');
      return;
    }

    // Add connection to the game
    if (!gameConnections.has(gameId)) {
      gameConnections.set(gameId, []);
    }
    gameConnections.get(gameId).push({
      ws,
      userId: user.id,
      username: user.username
    });

    console.log(`User ${user.username} connected to game ${gameId}`);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: `Connected to game ${game.name}`,
      gameId,
      username: user.username
    }));

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log(`Message from ${user.username} in game ${gameId}:`, message);
        // Could handle additional message types here
      } catch (error) {
        console.error('Invalid message format:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      const connections = gameConnections.get(gameId);
      if (connections) {
        const index = connections.findIndex(c => c.ws === ws);
        if (index !== -1) {
          connections.splice(index, 1);
        }
      }
      console.log(`User ${user.username} disconnected from game ${gameId}`);

      // Notify remaining players
      broadcastToGame(gameId, {
        type: 'player-disconnected',
        username: user.username
      });
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return wss;
};

export const broadcastToGame = (gameId, message) => {
  const connections = gameConnections.get(gameId);
  if (!connections) return;

  const messageStr = JSON.stringify(message);
  connections.forEach(({ ws }) => {
    if (ws.readyState === 1) { // 1 = OPEN
      ws.send(messageStr);
    }
  });
};

export const getGameConnections = () => gameConnections;
