// ═══════════════════════════════════════════════════════════
// QA Forge — Gemini AI Client Setup
// Google Gen AI SDK initialization
// ═══════════════════════════════════════════════════════════

import { GoogleGenAI } from '@google/genai';
import { Agent, setGlobalDispatcher } from 'undici';
import { config } from './index';
import { logger } from './logger';

// Set global undici dispatcher to prevent headers timeout for thinking models (e.g. Gemma 4)
setGlobalDispatcher(
  new Agent({
    headersTimeout: 300000, // 5 minutes
    bodyTimeout: 300000,    // 5 minutes
  })
);

export const ai = new GoogleGenAI({
  apiKey: config.GEMINI_API_KEY,
});

export const AI_MODEL = config.GEMINI_MODEL;

/**
 * Call Gemini with a system prompt and user message.
 * Returns parsed JSON from the response.
 */
export async function callAgent<T>(options: {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<{ data: T; usage: { input_tokens: number; output_tokens: number } }> {
  const { systemPrompt, userMessage, maxTokens = 4096, temperature = 0 } = options;

  logger.debug({ maxTokens, temperature, model: AI_MODEL }, 'Calling Gemini API');

  const response = await ai.models.generateContent({
    model: AI_MODEL,
    contents: userMessage,
    config: {
      systemInstruction: systemPrompt,
      temperature,
      maxOutputTokens: maxTokens,
      responseMimeType: 'application/json',
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('No text response from AI agent');
  }

  const parsed = JSON.parse(text) as T;

  return {
    data: parsed,
    usage: {
      input_tokens: response.usageMetadata?.promptTokenCount || 0,
      output_tokens: response.usageMetadata?.candidatesTokenCount || 0,
    },
  };
}

export default ai;
