# APITestify

AI-powered API test case generator. Provide your API details via a Swagger/OpenAPI URL, a curl command, or manual input — Claude AI generates a comprehensive test suite covering happy path, authentication, validation, error handling, security, and edge cases.

---

## Features

- **Three input modes**
  - **Swagger / OpenAPI** — paste a spec URL, browse endpoints, select one to test
  - **cURL command** — paste any curl command and auto-extract method, URL, headers, body, and auth
  - **Manual input** — Postman-style form with method, URL, headers, query params, auth, and body tabs
- **AI-generated test cases** — 15–25 tests per endpoint using Claude Opus 4.6 with adaptive thinking
- **Streaming progress UI** — animated step-by-step progress while Claude generates
- **Categorised results** — Happy Path, Authentication, Validation, Error Handling, Security, Edge Cases
- **Filter & export** — filter by category, copy individual tests as curl, export full suite as JSON

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI | Anthropic Claude Opus 4.6 (adaptive thinking) |
| Backend | Node.js, Express, `@anthropic-ai/sdk` |
| Frontend | React 18, Vite, Tailwind CSS |
| Spec parsing | `js-yaml`, `axios` |

---

## Project Structure

```
apiTestingTool/
├── backend/
│   ├── server.js               # Express app entry point
│   ├── routes/
│   │   └── generate.js         # /api/generate, /api/parse-swagger, /api/parse-curl
│   └── services/
│       ├── testGenerator.js    # Streams test cases from Claude via SSE
│       ├── swaggerParser.js    # Fetches and parses Swagger/OpenAPI specs
│       └── curlParser.js       # Parses curl commands into API details
├── frontend/
│   ├── index.html
│   ├── vite.config.js          # Dev proxy: /api → localhost:3001
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       └── components/
│           ├── Header.jsx
│           ├── InputSection.jsx     # Tab switcher
│           ├── SwaggerInput.jsx     # Swagger URL flow
│           ├── CurlInput.jsx        # cURL parse flow
│           ├── ManualInput.jsx      # Postman-style form
│           ├── GeneratingState.jsx  # Animated progress screen
│           ├── TestResults.jsx      # Summary + filter bar
│           └── TestCaseCard.jsx     # Individual test case card
├── package.json                # Root scripts
└── .env.example
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### 1. Clone and install

```bash
git clone <repo-url>
cd apiTestingTool
npm run install:all
```

### 2. Configure environment

```bash
cp .env.example backend/.env
```

Edit `backend/.env`:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
PORT=3001
```

### 3. Run

Open two terminals:

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

---

## API Reference

All routes are served by the backend on port `3001`.

### `POST /api/generate`

Generates test cases for an API endpoint. Streams results as Server-Sent Events.

**Request body**
```json
{
  "apiDetails": {
    "method": "POST",
    "url": "https://api.example.com/v1/users",
    "description": "Creates a new user",
    "headers": { "Content-Type": "application/json" },
    "queryParams": {},
    "body": { "name": "Jane Doe", "email": "jane@example.com" },
    "auth": "Bearer token"
  }
}
```

**SSE events**
| Event data | Meaning |
|---|---|
| `{ "progress": <number> }` | Characters generated so far (heartbeat) |
| `{ "done": true, "result": { ... } }` | Complete parsed test suite |
| `{ "error": "..." }` | Generation failed |

### `POST /api/parse-swagger`

Fetches and parses a Swagger/OpenAPI spec URL.

```json
{ "url": "https://petstore.swagger.io/v2/swagger.json" }
```

Returns `{ title, version, baseUrl, endpoints[] }`.

### `POST /api/parse-curl`

Parses a curl command string into structured API details.

```json
{ "curl": "curl -X POST https://api.example.com/users -H 'Authorization: Bearer token' -d '{\"name\":\"Jane\"}'" }
```

Returns `{ apiDetails: { method, url, headers, queryParams, body, auth } }`.

---

## Test Case Output Format

```json
{
  "summary": {
    "endpoint": "POST /v1/users",
    "totalTests": 18,
    "categories": {
      "Happy Path": 3,
      "Authentication": 3,
      "Validation": 5,
      "Error Handling": 3,
      "Security": 2,
      "Edge Cases": 2
    }
  },
  "testCases": [
    {
      "id": "TC001",
      "name": "Create user with valid data",
      "category": "Happy Path",
      "priority": "High",
      "description": "Verifies a user is created successfully with all required fields",
      "request": {
        "method": "POST",
        "url": "https://api.example.com/v1/users",
        "headers": { "Content-Type": "application/json", "Authorization": "Bearer valid_token" },
        "queryParams": {},
        "body": { "name": "Jane Doe", "email": "jane@example.com" }
      },
      "expectedResponse": {
        "statusCode": 201,
        "description": "User created successfully",
        "assertions": [
          "Response contains a user id field",
          "Response email matches the request email",
          "Response time is under 2000ms"
        ]
      },
      "notes": "Requires a valid bearer token in the Authorization header"
    }
  ]
}
```

---

## Development Scripts

```bash
npm run install:all      # Install dependencies for both backend and frontend
npm run dev:backend      # Start backend with nodemon (auto-reload)
npm run dev:frontend     # Start Vite dev server
npm run build:frontend   # Build frontend for production
npm run start:backend    # Start backend without nodemon
```
