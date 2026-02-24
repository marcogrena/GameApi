# GameApi
Api Rest for WEB online games

## Requirements
- Node.js
- npm

## Install
```bash
npm install
```

## Start the application (Node.js)
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

The API listens on `PORT` (default: `3000`).

## API Docs
Swagger UI is available at:

```
http://localhost:3000/api-docs
```

## Consume the API
Register a user to get an API key (required for protected routes):

```bash
curl -X POST http://localhost:3000/auth/register \
	-H "Content-Type: application/json" \
	-d '{"username":"john_doe"}'
```

Use the returned `apiKey` in the `X-API-Key` header:

```bash
# List games
curl http://localhost:3000/games \
	-H "X-API-Key: <apiKey>"

# Create a game
curl -X POST http://localhost:3000/games \
	-H "Content-Type: application/json" \
	-H "X-API-Key: <apiKey>" \
	-d '{"name":"Chess Game 1"}'
```

