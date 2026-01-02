import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured on the server.' },
      { status: 500 },
    );
  }

  const { question, context } = await req.json();

  if (!question || typeof question !== 'string') {
    return NextResponse.json(
      { error: 'A valid question is required.' },
      { status: 400 },
    );
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content:
            'You are an expert AI agent that answers user questions clearly and concisely. Always provide helpful, factual answers and cite assumptions when necessary.',
        },
        {
          role: 'user',
          content: context
            ? `Context:\n${context}\n\nQuestion:\n${question}`
            : question,
        },
      ],
    });

    const answer =
      'output_text' in response ? response.output_text : extractText(response);

    if (!answer) {
      return NextResponse.json(
        { error: 'Unable to generate an answer.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('QA route error:', error);
    return NextResponse.json(
      { error: 'Failed to generate an answer.' },
      { status: 500 },
    );
  }
}

function extractText(response: OpenAI.Responses.Response): string | null {
  const output = (response as { output?: unknown }).output;
  if (!output || !Array.isArray(output)) {
    return null;
  }

  for (const item of output) {
    const entry = item as Record<string, unknown>;
    if (entry?.type === 'output_text') {
      const content = entry.content;
      if (typeof content === 'string') {
        return content;
      }
    }

    if (Array.isArray(entry?.content)) {
      for (const block of entry.content) {
        const blockEntry = block as Record<string, unknown>;
        if (blockEntry?.type === 'output_text' && typeof blockEntry.text === 'string') {
          return blockEntry.text;
        }
        if (typeof blockEntry?.text === 'string') {
          return blockEntry.text;
        }
      }
    }

    if (typeof entry?.text === 'string') {
      return entry.text;
    }
  }

  return null;
}
