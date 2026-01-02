# Agentic Studio

Agentic Studio is a full-stack Next.js application that blends conversational question answering with text-to-video generation. It ships with a modern Tailwind-powered UI, serverless API routes for OpenAI Q&A, and Replicate-powered video synthesis.

## Features
- Conversational Q&A agent that preserves context across turns for grounded answers.
- Text-to-video generation powered by the `lucataco/zeroscope-v2-xl` diffusion model on Replicate.
- Responsive, cinematic UI with real-time status updates for long-running jobs.
- TypeScript-first codebase with linting, formatting, and Tailwind CSS.

## Prerequisites
Create an `.env.local` based on the template below and provide API credentials.

```bash
cp .env.example .env.local
```

| Variable | Description |
| --- | --- |
| `OPENAI_API_KEY` | Server-side key for the OpenAI Responses API. |
| `REPLICATE_API_TOKEN` | Personal access token for the Replicate API. |

## Development
Install dependencies and run the local server:

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to interact with the agent.

## Testing the APIs

```bash
# Question & Answer
curl -X POST http://localhost:3000/api/qa \
  -H 'Content-Type: application/json' \
  -d '{"question":"What is machine learning?"}'

# Text-to-Video
curl -X POST http://localhost:3000/api/text-to-video \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"A cinematic drone shot over snowy mountains at sunrise."}'
```

## Deployment
This project is production-ready for Vercel:

```bash
npm run build
npm start
```

Use the provided Vercel command to publish the app once the build succeeds.
