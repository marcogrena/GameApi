import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../../data');
const usersFile = path.join(dataDir, 'users.json');
const gamesFile = path.join(dataDir, 'games.json');

// Initialize data directory and files
const initializeDb = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(gamesFile)) {
    fs.writeFileSync(gamesFile, JSON.stringify([], null, 2));
  }
};

// Helper functions to read/write data
const readUsers = () => {
  try {
    return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  } catch {
    return [];
  }
};

const writeUsers = (users) => {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

const readGames = () => {
  try {
    return JSON.parse(fs.readFileSync(gamesFile, 'utf8'));
  } catch {
    return [];
  }
};

const writeGames = (games) => {
  fs.writeFileSync(gamesFile, JSON.stringify(games, null, 2));
};

// User operations
export const registerUser = (username) => {
  const users = readUsers();
  
  if (users.find(u => u.username === username)) {
    throw new Error('User already exists');
  }

  const apiKey = uuidv4() + uuidv4().replace(/-/g, '');
  const newUser = {
    id: uuidv4(),
    username,
    apiKey,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeUsers(users);
  return newUser;
};

export const getUserByApiKey = (apiKey) => {
  const users = readUsers();
  return users.find(u => u.apiKey === apiKey);
};

export const getUserById = (userId) => {
  const users = readUsers();
  return users.find(u => u.id === userId);
};

// Game operations
export const createGame = (userId, gameName) => {
  const games = readGames();
  
  const newGame = {
    id: uuidv4(),
    name: gameName,
    ownerId: userId,
    players: [],
    moves: [],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  games.push(newGame);
  writeGames(games);
  return newGame;
};

export const getGamesByUserId = (userId) => {
  const games = readGames();
  return games.filter(g => g.ownerId === userId);
};

export const getGameById = (gameId) => {
  const games = readGames();
  return games.find(g => g.id === gameId);
};

export const updateGame = (gameId, updates) => {
  const games = readGames();
  const game = games.find(g => g.id === gameId);
  
  if (!game) return null;
  
  Object.assign(game, updates, { updatedAt: new Date().toISOString() });
  writeGames(games);
  return game;
};

export const deleteGame = (gameId) => {
  const games = readGames();
  const index = games.findIndex(g => g.id === gameId);
  
  if (index === -1) return false;
  
  games.splice(index, 1);
  writeGames(games);
  return true;
};

// Player operations
export const addPlayerToGame = (gameId, playerName) => {
  const games = readGames();
  const game = games.find(g => g.id === gameId);
  
  if (!game) return null;
  
  const newPlayer = {
    id: uuidv4(),
    name: playerName,
    joinedAt: new Date().toISOString()
  };

  game.players.push(newPlayer);
  game.updatedAt = new Date().toISOString();
  writeGames(games);
  return newPlayer;
};

export const removePlayerFromGame = (gameId, playerId) => {
  const games = readGames();
  const game = games.find(g => g.id === gameId);
  
  if (!game) return false;
  
  const index = game.players.findIndex(p => p.id === playerId);
  if (index === -1) return false;
  
  game.players.splice(index, 1);
  game.updatedAt = new Date().toISOString();
  writeGames(games);
  return true;
};

export const getGamePlayers = (gameId) => {
  const game = getGameById(gameId);
  return game ? game.players : [];
};

// Move operations
export const addMoveToGame = (gameId, playerId, moveData) => {
  const games = readGames();
  const game = games.find(g => g.id === gameId);
  
  if (!game) return null;
  
  const newMove = {
    id: uuidv4(),
    playerId,
    data: moveData,
    timestamp: new Date().toISOString()
  };

  game.moves.push(newMove);
  game.updatedAt = new Date().toISOString();
  writeGames(games);
  return newMove;
};

export const getGameMoves = (gameId) => {
  const game = getGameById(gameId);
  return game ? game.moves : [];
};

// Initialize database on module load
initializeDb();
