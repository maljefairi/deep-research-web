import { z } from 'zod';

const envSchema = z.object({
  // OpenAI Configuration
  NEXT_PUBLIC_OPENAI_KEY: z.string().min(1, 'OpenAI API key is required'),
  NEXT_PUBLIC_OPENAI_ENDPOINT: z.string().url().default('https://api.openai.com/v1'),
  NEXT_PUBLIC_OPENAI_MODEL: z.string().default('gpt-4-turbo-preview'),

  // Firecrawl Configuration
  NEXT_PUBLIC_FIRECRAWL_KEY: z.string().min(1, 'Firecrawl API key is required'),
  NEXT_PUBLIC_FIRECRAWL_BASE_URL: z.string().url().default('https://api.firecrawl.xyz'),

  // Application Configuration
  CONTEXT_SIZE: z.coerce.number().int().positive().default(128000),
});

// Parse and validate environment variables
const env = envSchema.parse({
  NEXT_PUBLIC_OPENAI_KEY: process.env.NEXT_PUBLIC_OPENAI_KEY,
  NEXT_PUBLIC_OPENAI_ENDPOINT: process.env.NEXT_PUBLIC_OPENAI_ENDPOINT,
  NEXT_PUBLIC_OPENAI_MODEL: process.env.NEXT_PUBLIC_OPENAI_MODEL,
  NEXT_PUBLIC_FIRECRAWL_KEY: process.env.NEXT_PUBLIC_FIRECRAWL_KEY,
  NEXT_PUBLIC_FIRECRAWL_BASE_URL: process.env.NEXT_PUBLIC_FIRECRAWL_BASE_URL,
  CONTEXT_SIZE: process.env.CONTEXT_SIZE,
});

export const config = {
  openai: {
    apiKey: env.NEXT_PUBLIC_OPENAI_KEY,
    endpoint: env.NEXT_PUBLIC_OPENAI_ENDPOINT,
    model: env.NEXT_PUBLIC_OPENAI_MODEL,
  },
  firecrawl: {
    apiKey: env.NEXT_PUBLIC_FIRECRAWL_KEY,
    baseUrl: env.NEXT_PUBLIC_FIRECRAWL_BASE_URL,
  },
  app: {
    contextSize: env.CONTEXT_SIZE,
  },
} as const;

// Type for the config object
export type Config = typeof config; 