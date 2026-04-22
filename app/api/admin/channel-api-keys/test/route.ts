import { NextRequest, NextResponse } from 'next/server';

const REPLICATE_TEST_MODEL = 'prunaai/z-image-turbo';
const REPLICATE_API_BASE_URL = 'https://api.replicate.com';
const FAL_TEST_MODEL = 'fal-ai/z-image/turbo';
const FAL_QUEUE_BASE_URL = 'https://queue.fal.run';
const TEST_PROMPT =
  'A clean studio product photo of a ceramic teacup on a white background, soft natural lighting, sharp detail, photorealistic.';

type Channel = 'fal' | 'replicate';

interface TestRequestBody {
  channel?: Channel;
  service_url?: string;
  api_key?: string;
}

interface UpstreamTestConfig {
  channel: Channel;
  model: string;
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

function normalizeBaseUrl(serviceUrl: string | undefined, defaultBaseUrl: string): string {
  const normalized = (serviceUrl || '').trim();
  if (!normalized) {
    return defaultBaseUrl;
  }

  try {
    const url = normalized.includes('://')
      ? new URL(normalized)
      : new URL(`https://${normalized.replace(/^\/+/, '')}`);

    if (!['http:', 'https:'].includes(url.protocol)) {
      return defaultBaseUrl;
    }

    return url.origin;
  } catch {
    return defaultBaseUrl;
  }
}

async function readResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  const text = await response.text();
  return text || null;
}

function extractMessage(payload: unknown, fallback: string): string {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const value = record.detail || record.error || record.message || record.title;
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return fallback;
}

function buildTestConfig(body: TestRequestBody): UpstreamTestConfig | null {
  if (!body.channel || !body.api_key) {
    return null;
  }

  if (body.channel === 'replicate') {
    return {
      channel: 'replicate',
      model: REPLICATE_TEST_MODEL,
      url: `${normalizeBaseUrl(body.service_url, REPLICATE_API_BASE_URL)}/v1/models/${REPLICATE_TEST_MODEL}/predictions`,
      headers: {
        Authorization: `Bearer ${body.api_key}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: {
        input: {
          prompt: TEST_PROMPT,
          width: 1024,
          height: 1024,
        },
      },
    };
  }

  if (body.channel === 'fal') {
    return {
      channel: 'fal',
      model: FAL_TEST_MODEL,
      url: `${normalizeBaseUrl(body.service_url, FAL_QUEUE_BASE_URL)}/${FAL_TEST_MODEL}`,
      headers: {
        Authorization: `Key ${body.api_key}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: {
        prompt: TEST_PROMPT,
        image_size: 'square_hd',
        num_inference_steps: 8,
        num_images: 1,
        output_format: 'png',
        enable_safety_checker: true,
      },
    };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('authorization')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as TestRequestBody;
    const config = buildTestConfig(body);

    if (!config) {
      return NextResponse.json(
        { message: 'Missing or invalid channel test payload' },
        { status: 400 }
      );
    }

    const upstreamResponse = await fetch(config.url, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify(config.body),
      cache: 'no-store',
    });

    const upstreamBody = await readResponse(upstreamResponse);

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        {
          message: extractMessage(upstreamBody, `${config.channel} test failed`),
          body: upstreamBody,
        },
        { status: upstreamResponse.status }
      );
    }

    return NextResponse.json({
      channel: config.channel,
      model: config.model,
      status: upstreamResponse.status,
      body: upstreamBody,
    });
  } catch (error) {
    console.error('Channel API key test proxy failed:', error);

    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Channel API key test failed',
      },
      { status: 500 }
    );
  }
}
