export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Parse a Server-Sent Events (SSE) stream from a chat completions response.
 * Yields StreamChunk objects for each data event.
 */
// Anthropic Messages API streaming types
export interface MessagesStreamChunk {
  type: string;
  message?: {
    id: string;
    type: string;
    role: string;
    model: string;
    usage?: { input_tokens: number; output_tokens: number };
  };
  index?: number;
  delta?: { type: string; text?: string; stop_reason?: string };
  usage?: { input_tokens?: number; output_tokens?: number };
  content_block?: { type: string; text: string };
}

/**
 * Parse a Server-Sent Events (SSE) stream from an Anthropic Messages API response.
 * Anthropic uses `event: <type>\ndata: <json>` format.
 * Yields MessagesStreamChunk objects for each event.
 */
export async function* parseMessagesSSEStream(
  response: Response
): AsyncGenerator<MessagesStreamChunk> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No readable stream");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let currentEvent = "";

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith("event: ")) {
          currentEvent = trimmed.slice(7);
          continue;
        }

        if (!trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6);

        try {
          const parsed = JSON.parse(data);
          // Attach the event type
          parsed.type = parsed.type || currentEvent;
          yield parsed as MessagesStreamChunk;
        } catch {
          // Skip malformed chunks
        }

        currentEvent = "";
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Parse a Server-Sent Events (SSE) stream from a chat completions response.
 * Yields StreamChunk objects for each data event.
 */
export async function* parseSSEStream(
  response: Response
): AsyncGenerator<StreamChunk> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No readable stream");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6);
        if (data === "[DONE]") return;

        try {
          yield JSON.parse(data) as StreamChunk;
        } catch {
          // Skip malformed chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// Gemini Native API streaming types
export interface GeminiStreamChunk {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
      role?: string;
    };
    finishReason?: string;
  }[];
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

/**
 * Parse a Server-Sent Events (SSE) stream from a Gemini Native API response.
 * Gemini sends `data: <json>` where JSON may span multiple lines.
 * Uses a state-machine approach: accumulate lines after `data:` until
 * a blank line (SSE event boundary) signals the end of the payload.
 */
export async function* parseGeminiSSEStream(
  response: Response
): AsyncGenerator<GeminiStreamChunk> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No readable stream");

  const decoder = new TextDecoder();
  let buffer = "";
  let dataBuffer = ""; // accumulates multi-line data payload
  let collecting = false;

  function* flush(): Generator<GeminiStreamChunk> {
    if (!dataBuffer) return;
    const payload = dataBuffer.trim();
    dataBuffer = "";
    collecting = false;
    if (payload === "[DONE]") return;
    try {
      yield JSON.parse(payload) as GeminiStreamChunk;
    } catch {
      // Skip malformed chunks
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();

        // Blank line = SSE event boundary, flush accumulated data
        if (trimmed === "") {
          yield* flush();
          continue;
        }

        if (trimmed.startsWith("data: ")) {
          // If we were already collecting, flush previous payload first
          if (collecting) {
            yield* flush();
          }
          dataBuffer = trimmed.slice(6);
          collecting = true;
        } else if (collecting) {
          // Continuation line of multi-line data payload
          dataBuffer += "\n" + trimmed;
        }
        // skip event: lines and other non-data lines
      }
    }

    // Flush any remaining data at end of stream
    yield* flush();
  } finally {
    reader.releaseLock();
  }
}
