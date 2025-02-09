import { openai, defaultModelConfig } from './ai/providers';
import { z } from 'zod';

// Define input validation schema
const promptSchema = z.string().min(1, 'Prompt cannot be empty').max(4000, 'Prompt too long');

// Define response type
interface OptimizationResult {
  suggestion: string;
  error?: string;
}

export async function optimizeWorkflow(userPrompt: string): Promise<OptimizationResult> {
  try {
    // Validate input
    const validatedPrompt = promptSchema.parse(userPrompt);

    const response = await openai.chat.completions.create({
      ...defaultModelConfig,
      messages: [
        { 
          role: "system", 
          content: "You are an AI research assistant helping to optimize research workflows. Provide clear, actionable suggestions for improving research efficiency." 
        },
        { role: "user", content: validatedPrompt }
      ]
    });

    if (!response.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from AI service');
    }

    return {
      suggestion: response.choices[0].message.content
    };
  } catch (error) {
    console.error('Workflow optimization error:', error);
    return {
      suggestion: '',
      error: error instanceof Error ? error.message : 'Failed to optimize workflow'
    };
  }
}
