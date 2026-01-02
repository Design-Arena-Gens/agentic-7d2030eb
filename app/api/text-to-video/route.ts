import { NextRequest, NextResponse } from 'next/server';

const MODEL_VERSION =
  'a0f98598516e476eeede63342445409f345726a8fcf28de39793c60c0fdd0292'; // lucataco/zeroscope-v2-xl
const API_BASE = 'https://api.replicate.com/v1';

export async function POST(req: NextRequest) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: 'REPLICATE_API_TOKEN is not configured on the server.' },
      { status: 500 },
    );
  }

  const { prompt, guidanceScale = 12, fps = 24 } = await req.json();

  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json(
      { error: 'A valid text prompt is required.' },
      { status: 400 },
    );
  }

  try {
    const prediction = await createPrediction(prompt, guidanceScale, fps);
    const videoUrl = await pollPrediction(prediction.urls.get);

    return NextResponse.json({ videoUrl });
  } catch (error) {
    console.error('Text-to-video route error:', error);
    return NextResponse.json(
      { error: 'Failed to generate video.' },
      { status: 500 },
    );
  }
}

type Prediction = {
  id: string;
  status: string;
  output: string[] | null;
  urls: {
    get: string;
  };
};

async function createPrediction(
  prompt: string,
  guidanceScale: number,
  fps: number,
) {
  const response = await fetch(`${API_BASE}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: MODEL_VERSION,
      input: {
        prompt,
        guidance_scale: guidanceScale,
        fps,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Replicate prediction failed: ${response.status} ${error}`,
    );
  }

  return (await response.json()) as Prediction;
}

async function pollPrediction(predictionUrl: string) {
  const headers = {
    Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
    'Content-Type': 'application/json',
  };

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const response = await fetch(predictionUrl, { headers });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to poll prediction: ${error}`);
    }

    const prediction = (await response.json()) as Prediction;

    if (prediction.status === 'succeeded' && prediction.output?.length) {
      return prediction.output[prediction.output.length - 1];
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(`Prediction failed with status: ${prediction.status}`);
    }

    await wait(5000);
  }

  throw new Error('Prediction timed out.');
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
