# WebSocket Documentation

The GameApi supports real-time game updates through WebSocket connections.

## Connecting to WebSocket

Connect to the WebSocket server using your API key and the game ID:

```
ws://localhost:3000?apiKey=YOUR_API_KEY&gameId=GAME_ID
```

### Parameters:
- `apiKey` (required): Your API key (same as X-API-Key header)
- `gameId` (required): The ID of the game to connect to

### Requirements:
- You must be a player or owner of the game to connect
- The game must exist

## Message Types

### 1. Connected Message (on connection)
```json
{
  "type": "connected",
  "message": "Connected to game Chess Game 1",
  "gameId": "b4585647-e1dc-49e8-a2d3-dc3f46f76f21",
  "username": "john_doe"
}
```

### 2. Move Update
Sent when a player makes a move:
```json
{
  "type": "move",
  "gameId": "b4585647-e1dc-49e8-a2d3-dc3f46f76f21",
  "move": {
    "id": "22072b02-9845-4d6d-9a7f-b84bce2b3416",
    "playerId": "f74cd081-0bca-4624-9ddb-8aff13d14ea4",
    "data": {"mossa": "e4"},
    "timestamp": "2026-02-24T16:37:15.462Z"
  },
  "playerName": "pippo"
}
```

### 3. Player Joined
Sent when a new player joins the game:
```json
{
  "type": "player-joined",
  "gameId": "b4585647-e1dc-49e8-a2d3-dc3f46f76f21",
  "player": {
    "id": "f74cd081-0bca-4624-9ddb-8aff13d14ea4",
    "name": "pippo",
    "joinedAt": "2026-02-24T16:08:46.309Z"
  }
}
```

### 4. Player Removed
Sent when a player is removed from the game:
```json
{
  "type": "player-removed",
  "gameId": "b4585647-e1dc-49e8-a2d3-dc3f46f76f21",
  "playerId": "f74cd081-0bca-4624-9ddb-8aff13d14ea4"
}
```

### 5. Player Disconnected
Sent when a player WebSocket connection closes:
```json
{
  "type": "player-disconnected",
  "username": "john_doe"
}
```

## JavaScript Example

```javascript
// Connect to WebSocket
const apiKey = '4cf54f7a-8887-44c5-8739-75116039b698341d0937019d448d8641d2d18aafb5e0';
const gameId = 'b4585647-e1dc-49e8-a2d3-dc3f46f76f21';
const ws = new WebSocket(`ws://localhost:3000?apiKey=${apiKey}&gameId=${gameId}`);

// Handle incoming messages
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch(message.type) {
    case 'connected':
      console.log('Connected to game:', message.gameId);
      break;
    case 'move':
      console.log(`${message.playerName} made a move:`, message.move.data);
      break;
    case 'player-joined':
      console.log(`${message.player.name} joined the game`);
      break;
    case 'player-removed':
      console.log(`Player ${message.playerId} was removed`);
      break;
    case 'player-disconnected':
      console.log(`${message.username} disconnected`);
      break;
  }
};

// Handle connection errors
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Connection closed');
};
```

## Error Codes

- `4000`: Missing apiKey or gameId parameter
- `4001`: Invalid API key
- `4002`: Game not found
- `4003`: Access denied (not a player or owner of the game)

## Features

- **Real-time updates**: All connected players receive instant updates about game changes
- **Authentication**: Only authorized users can connect to a game's WebSocket
- **Automatic notifications**: Players are notified when:
  - Someone joins the game
  - Someone makes a move
  - Someone leaves/disconnects
  - A player is removed from the game
