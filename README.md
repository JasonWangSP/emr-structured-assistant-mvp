# conversation-to-emr

Minimal Next.js + TypeScript scaffold for turning conversations into EMR-ready structured data.
UI theme adopts low-saturation medical blues with a white base to reduce visual fatigue and align with clinical tooling.

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Open http://localhost:3000

## Current Pages

- `/` renders a simple "conversation-to-emr MVP" placeholder.

## Current API Routes

- `GET /api/parse-conversation` returns a placeholder JSON response.
- `POST /api/parse-conversation` returns the same placeholder JSON response.

## Structure

- `app/` Next.js app router pages
- `app/api/parse-conversation/` reserved API route
- `schemas/` JSON schema placeholders
- `prompts/` system prompt and constraints placeholders
- `lib/` shared utilities (parse/validate/llm placeholders)
- `components/` UI components (empty for now)
