import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { o3MiniModel } from '@/lib/ai/providers';
import { systemPrompt } from '@/lib/prompt';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, breadth, depth } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Generate verification questions with suggested answers
    const result = await generateObject({
      model: o3MiniModel,
      system: systemPrompt(),
      prompt: `I am about to research this topic: "${query}" with breadth ${breadth} and depth ${depth}.
      
Before starting the research, I need you to generate 3-4 verification questions to ensure we have the right focus.
For each question, also provide a suggested answer based on the query context.

Format your response as a list of questions where each question:
1. Helps verify the research direction
2. Has a clear goal explaining why this verification is important
3. Includes a suggested answer that the user can modify if needed
4. Uses an appropriate input type (text for short answers, multiline for detailed answers, or choice for specific options)`,
      schema: z.object({
        questions: z.array(
          z.object({
            id: z.string(),
            question: z.string(),
            goal: z.string(),
            suggestedAnswer: z.string(),
            type: z.enum(['text', 'multiline', 'choice']),
            options: z.array(z.string()).optional(),
          })
        ).min(2).max(4),
      }),
    });

    return NextResponse.json({
      questions: result.object.questions.map(q => ({
        ...q,
        id: q.id || uuidv4(),
      })),
    });

  } catch (error) {
    console.error('Error generating verification questions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate verification questions', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 