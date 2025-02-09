import OpenAI from 'openai';
import { config } from '../config';
import { getEncoding } from 'js-tiktoken';
import { RecursiveCharacterTextSplitter } from './text-splitter';

// Create OpenAI client with validated configuration
export const openai = new OpenAI({
  apiKey: config.openai.apiKey,
  baseURL: config.openai.endpoint,
});

// Default model configuration
export const defaultModelConfig = {
  model: config.openai.model,
  temperature: 0.7,
  max_tokens: 2000,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
  // Use validated context size from config
  contextSize: config.app.contextSize,
} as const;

// Export type for model configuration
export type ModelConfig = typeof defaultModelConfig;

// Models - Using gpt-4o-mini as it's the most widely supported model
export const o3MiniModel = openai('gpt-4o-mini');

const MinChunkSize = 140;
const encoder = getEncoding('cl100k_base');

// trim prompt to maximum context size
export function trimPrompt(
  prompt: string,
  contextSize = Number(process.env.CONTEXT_SIZE) || 128000,
) {
  if (!prompt) {
    return '';
  }

  const length = encoder.encode(prompt).length;
  if (length <= contextSize) {
    return prompt;
  }

  const overflowTokens = length - contextSize;
  // on average it's 3 characters per token, so multiply by 3 to get a rough estimate of the number of characters
  const chunkSize = prompt.length - overflowTokens * 3;
  if (chunkSize < MinChunkSize) {
    return prompt.slice(0, MinChunkSize);
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap: 0,
  });
  const trimmedPrompt = splitter.splitText(prompt)[0] ?? '';

  // last catch, there's a chance that the trimmed prompt is same length as the original prompt, due to how tokens are split & innerworkings of the splitter, handle this case by just doing a hard cut
  if (trimmedPrompt.length === prompt.length) {
    return trimPrompt(prompt.slice(0, chunkSize), contextSize);
  }

  // recursively trim until the prompt is within the context size
  return trimPrompt(trimmedPrompt, contextSize);
}