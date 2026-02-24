import express from 'express';
import {
  createGame,
  getGamesByUserId,
  getGameById,
  updateGame,
  deleteGame,
  addPlayerToGame,
  removePlayerFromGame,
  getGamePlayers,
  addMoveToGame,
  getGameMoves
} from '../db/database.js';
import { broadcastToGame } from '../websocket.js';

const router = express.Router();

/**
 * @swagger
 * /games:
 *   post:
 *     summary: Create a new game
 *     description: Creates a new game owned by the authenticated user
 *     tags:
 *       - Games
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the game
 *             required:
 *               - name
 *             example:
 *               name: Chess Game 1
 *     responses:
 *       201:
 *         description: Game created successfully
 *       400:
 *         description: Invalid game name
 *   get:
 *     summary: Get all games of the authenticated user
 *     description: Retrieves all games owned by the authenticated user
 *     tags:
 *       - Games
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of games
 */
router.post('/', (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid game name' });
    }

    const game = createGame(req.user.id, name.trim());
    res.status(201).json({
      message: 'Game created successfully',
      game
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /games:
 *   get:
 *     summary: Get all games of the authenticated user
 *     description: Retrieves all games owned by the authenticated user
 *     tags:
 *       - Games
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of games
 */
// GET /games - Get all games of the authenticated user
router.get('/', (req, res) => {
  try {
    const games = getGamesByUserId(req.user.id);
    res.json({
      count: games.length,
      games
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /games/{gameId}:
 *   get:
 *     summary: Get a specific game
 *     description: Retrieves a game by ID (user must own the game)
 *     tags:
 *       - Games
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: gameId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The game ID
 *     responses:
 *       200:
 *         description: Game details
 *       404:
 *         description: Game not found
 *       403:
 *         description: Access denied
 *   put:
 *     summary: Update a game
 *     description: Updates a game's name or status (user must own the game)
 *     tags:
 *       - Games
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: gameId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Game updated successfully
 *       404:
 *         description: Game not found
 *       403:
 *         description: Access denied
 *   delete:
 *     summary: Delete a game
 *     description: Deletes a game (user must own the game)
 *     tags:
 *       - Games
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: gameId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Game deleted successfully
 *       404:
 *         description: Game not found
 *       403:
 *         description: Access denied
 */
// GET /games/:gameId - Get a specific game
router.get('/:gameId', (req, res) => {
  try {
    const game = getGameById(req.params.gameId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ game });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /games/:gameId - Update game
router.put('/:gameId', (req, res) => {
  try {
    const game = getGameById(req.params.gameId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, status } = req.body;
    const updates = {};
    
    if (name) updates.name = name;
    if (status) updates.status = status;

    const updatedGame = updateGame(req.params.gameId, updates);
    res.json({
      message: 'Game updated successfully',
      game: updatedGame
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /games/:gameId - Delete a game
router.delete('/:gameId', (req, res) => {
  try {
    const game = getGameById(req.params.gameId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    deleteGame(req.params.gameId);
    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /games/{gameId}/players:
 *   post:
 *     summary: Add a player to a game
 *     description: Adds a new player to a game (user must own the game)
 *     tags:
 *       - Players
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: gameId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *             required:
 *               - name
 *     responses:
 *       201:
 *         description: Player added successfully
 *       400:
 *         description: Invalid player name
 *       403:
 *         description: Access denied
 *       404:
 *         description: Game not found
 *   get:
 *     summary: Get all players in a game
 *     description: Retrieves all players in a game (user must own the game)
 *     tags:
 *       - Players
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: gameId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of players
 *       403:
 *         description: Access denied
 *       404:
 *         description: Game not found
 */
// POST /games/:gameId/players - Add a player to a game
router.post('/:gameId/players', (req, res) => {
  try {
    const game = getGameById(req.params.gameId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid player name' });
    }

    const player = addPlayerToGame(req.params.gameId, name.trim());
    
    // Broadcast player joined event to all connected players
    broadcastToGame(req.params.gameId, {
      type: 'player-joined',
      gameId: req.params.gameId,
      player
    });
    
    res.status(201).json({
      message: 'Player added successfully',
      player
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /games/:gameId/players - Get all players in a game
router.get('/:gameId/players', (req, res) => {
  try {
    const game = getGameById(req.params.gameId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const players = getGamePlayers(req.params.gameId);
    res.json({
      gameId: req.params.gameId,
      count: players.length,
      players
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /games/{gameId}/players/{playerId}:
 *   delete:
 *     summary: Remove a player from a game
 *     description: Removes a player from a game (user must own the game)
 *     tags:
 *       - Players
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: gameId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: playerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Player removed successfully
 *       404:
 *         description: Player or game not found
 *       403:
 *         description: Access denied
 */
// DELETE /games/:gameId/players/:playerId - Remove a player from a game
router.delete('/:gameId/players/:playerId', (req, res) => {
  try {
    const game = getGameById(req.params.gameId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = removePlayerFromGame(req.params.gameId, req.params.playerId);
    
    if (!result) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Broadcast player removed event to all connected players
    broadcastToGame(req.params.gameId, {
      type: 'player-removed',
      gameId: req.params.gameId,
      playerId: req.params.playerId
    });

    res.json({ message: 'Player removed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /games/{gameId}/moves:
 *   post:
 *     summary: Add a move to a game
 *     description: Records a move for a player in a game (user must own the game)
 *     tags:
 *       - Moves
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: gameId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               playerId:
 *                 type: string
 *               data:
 *                 type: object
 *                 description: Move data as JSON object
 *             required:
 *               - playerId
 *               - data
 *     responses:
 *       201:
 *         description: Move added successfully
 *       400:
 *         description: Invalid playerId or move data
 *       403:
 *         description: Access denied
 *       404:
 *         description: Game or player not found
 *   get:
 *     summary: Get all moves in a game
 *     description: Retrieves all moves made in a game (user must own the game)
 *     tags:
 *       - Moves
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: gameId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of moves
 *       403:
 *         description: Access denied
 *       404:
 *         description: Game not found
 */
// POST /games/:gameId/moves - Add a move to a game
router.post('/:gameId/moves', (req, res) => {
  try {
    const game = getGameById(req.params.gameId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Verify that the authenticated user is a player in the game or the game owner
    const currentUserIsPlayer = game.players.some(p => p.id === req.user.id);
    const currentUserIsOwner = game.ownerId === req.user.id;
    if (!currentUserIsPlayer && !currentUserIsOwner) {
      return res.status(403).json({ error: 'Access denied: Only players and the game owner can post moves' });
    }

    const { playerId, data } = req.body;
    
    if (!playerId || typeof playerId !== 'string') {
      return res.status(400).json({ error: 'Invalid playerId' });
    }

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid move data (must be JSON object)' });
    }

    // Verify player exists in the game
    const player = game.players.find(p => p.id === playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found in this game' });
    }

    const move = addMoveToGame(req.params.gameId, playerId, data);
    
    // Broadcast move to all connected players
    broadcastToGame(req.params.gameId, {
      type: 'move',
      gameId: req.params.gameId,
      move,
      playerName: player.name
    });
    
    res.status(201).json({
      message: 'Move added successfully',
      move
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /games/:gameId/moves - Get all moves in a game
router.get('/:gameId/moves', (req, res) => {
  try {
    const game = getGameById(req.params.gameId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Verify that the authenticated user is a player in the game or the game owner
    const currentUserIsPlayer = game.players.some(p => p.id === req.user.id);
    const currentUserIsOwner = game.ownerId === req.user.id;
    if (!currentUserIsPlayer && !currentUserIsOwner) {
      return res.status(403).json({ error: 'Access denied: Only players and the game owner can view moves' });
    }

    const moves = getGameMoves(req.params.gameId);
    res.json({
      gameId: req.params.gameId,
      count: moves.length,
      moves
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /games/{gameId}/moves/{moveId}:
 *   get:
 *     summary: Get a specific move
 *     description: Retrieves a specific move from a game (user must own the game)
 *     tags:
 *       - Moves
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: gameId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: moveId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Move details
 *       404:
 *         description: Move or game not found
 *       403:
 *         description: Access denied
 */
// GET /games/:gameId/moves/:moveId - Get a specific move (filter from moves array)
router.get('/:gameId/moves/:moveId', (req, res) => {
  try {
    const game = getGameById(req.params.gameId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const move = game.moves.find(m => m.id === req.params.moveId);
    
    if (!move) {
      return res.status(404).json({ error: 'Move not found' });
    }

    res.json({ move });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
