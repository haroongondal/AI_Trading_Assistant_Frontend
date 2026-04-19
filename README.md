# AI Trading Assistant – Frontend

Next.js 15 frontend: chat (streaming), portfolio, and notifications. Uses Node 24 (see below).

## Quick start

```bash
cp .env.example .env   # set NEXT_PUBLIC_API_URL (e.g. http://localhost:8000)
npm install
npm run dev
```

App: http://localhost:3000. Backend must be running (default http://localhost:8000).

## Node 24

This project uses **Node 24**. To use it only here (not globally):

```bash
nvm install 24    # if needed
nvm use           # uses Node 24 in this directory only
npm install
```

`package.json` has `"engines": { "node": ">=24.0.0" }` and `.nvmrc` contains `24`.

## Env vars

Copy `.env.example` to `.env`. Set `NEXT_PUBLIC_API_URL` to your backend URL (e.g. `http://localhost:8000`). API requests use `credentials: "include"` so the backend can attach the HttpOnly session cookie after **Sign in with Google** (configure OAuth on the backend; see [backend/README.md](../backend/README.md)).

## Chat model selection

- The chat header has a **Model** dropdown.
- Local hosted `Llama 3.1` is available by default and tagged `very slow`.
- Third-party providers (Google/Groq/Hugging Face/OpenRouter/GitHub/Cerebras)
  appear when exposed by backend `GET /api/chat/models`.
- Disabled options indicate missing backend key/dependency configuration.
- `limited tools` in label means chat still works but may skip tool-calling flows.

## Scripts

- `npm run dev` – development
- `npm run build` – production build
- `npm run start` – run production build

## License

MIT.
