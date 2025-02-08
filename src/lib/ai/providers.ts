import { createOpenAI, type OpenAIProviderSettings } from '@ai-sdk/openai';
import { getEncoding } from 'js-tiktoken';

import { RecursiveCharacterTextSplitter } from './text-splitter';

interface CustomOpenAIProviderSettings extends OpenAIProviderSettings {
  baseURL?: string;
}

// Providers
const openai = createOpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY!,
  baseURL: process.env.NEXT_PUBLIC_OPENAI_ENDPOINT || 'https://api.openai.com/v1',
} as CustomOpenAIProviderSettings);

const isCustomEndpoint =
  process.env.NEXT_PUBLIC_OPENAI_ENDPOINT &&
  process.env.NEXT_PUBLIC_OPENAI_ENDPOINT !== 'https://api.openai.com/v1';
const customModel = process.env.NEXT_PUBLIC_OPENAI_MODEL;

// Models
export const o3MiniModel = openai(
  isCustomEndpoint && customModel ? customModel : 'gpt-3.5-turbo',
  {
    temperature: 0.7,
    maxTokens: 4000,
  },
);

const MinChunkSize = 140;
const encoder = getEncoding('cl100k_base');

// trim prompt to maximum context size
export function trimPrompt(
  prompt: string,
  contextSize = Number(process.env.CONTEXT_SIZE) || 128_000,
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