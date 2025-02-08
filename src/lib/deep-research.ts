import FirecrawlApp, { SearchResponse } from '@mendable/firecrawl-js';
import { generateObject } from 'ai';
import { compact } from 'lodash-es';
import pLimit from 'p-limit';
import { z } from 'zod';

import { o3MiniModel, trimPrompt } from './ai/providers';
import { systemPrompt } from './prompt';

type ResearchResult = {
  learnings: string[];
  visitedUrls: string[];
};

type ResearchState = {
  status: 'initial' | 'questions' | 'researching' | 'complete' | 'error';
  questions?: {
    query: string;
    researchGoal: string;
  }[];
  answers?: string[];
  progress: number;
  step: string;
  learnings: string[];
  visitedUrls: string[];
  error?: string;
};

// Increase delay between requests to avoid rate limits
const ConcurrencyLimit = 1;
const RequestDelay = 1000; // 1 second delay between requests

// Maximum content length to avoid token limits
const MaxContentLength = 8000;

// Helper function to delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to truncate content
function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '...';
}

// Initialize Firecrawl with API key
const firecrawl = new FirecrawlApp({
  apiKey: process.env.NEXT_PUBLIC_FIRECRAWL_KEY ?? '',
  apiUrl: process.env.NEXT_PUBLIC_FIRECRAWL_BASE_URL,
});

// Generate initial research questions
export async function generateInitialQuestions(query: string) {
  console.log('Generating initial questions for:', query);
  const res = await generateObject({
    model: o3MiniModel,
    system: systemPrompt(),
    prompt: `Given the following research topic, generate a list of key questions that need to be answered before starting the research. These questions should help clarify the scope and direction of the research: <topic>${query}</topic>`,
    schema: z.object({
      questions: z
        .array(
          z.object({
            query: z.string().describe('The question to ask'),
            researchGoal: z
              .string()
              .describe('Why this question is important for the research'),
          }),
        )
        .describe('List of questions to ask before starting research'),
    }),
  });

  return res.object.questions;
}

// take user query and answers, return a list of SERP queries
async function generateSerpQueries({
  query,
  answers,
  numQueries = 3,
  learnings,
}: {
  query: string;
  answers: string[];
  numQueries?: number;
  learnings?: string[];
}) {
  console.log('Generating SERP queries for:', query);
  const res = await generateObject({
    model: o3MiniModel,
    system: systemPrompt(),
    prompt: `Given the following research topic and answers to preliminary questions, generate a list of SERP queries to research the topic. Return a maximum of ${numQueries} queries, but feel free to return less if the original prompt is clear. Make sure each query is unique and not similar to each other.

Topic: <topic>${query}</topic>

Preliminary Answers:
${answers.map((answer, i) => `${i + 1}. ${answer}`).join('\n')}

${learnings ? `Previous Learnings:\n${learnings.join('\n')}` : ''}`,
    schema: z.object({
      queries: z
        .array(
          z.object({
            query: z.string().describe('The SERP query'),
            researchGoal: z
              .string()
              .describe(
                'First talk about the goal of the research that this query is meant to accomplish, then go deeper into how to advance the research once the results are found, mention additional research directions. Be as specific as possible, especially for additional research directions.',
              ),
          }),
        )
        .describe(`List of SERP queries, max of ${numQueries}`),
    }),
  });

  console.log('Generated queries:', res.object.queries);
  return res.object.queries.slice(0, numQueries);
}

async function processSerpResult({
  query,
  result,
  numFollowUpQuestions,
}: {
  query: string;
  result: SearchResponse;
  numFollowUpQuestions: number;
}) {
  console.log('Processing SERP results for query:', query);
  
  // Truncate and combine content to avoid token limits
  const combinedContent = result.data
    .map(item => item.content)
    .join('\n\n')
    .slice(0, MaxContentLength);

  const res = await generateObject({
    model: o3MiniModel,
    abortSignal: AbortSignal.timeout(60_000),
    system: systemPrompt(),
    prompt: `Given the following search results, extract key learnings and generate follow-up questions for deeper research. Format the content as bullet points and be concise:

<content>
${combinedContent}
</content>`,
    schema: z.object({
      learnings: z
        .array(z.string())
        .describe('Key learnings extracted from the search results'),
      followUpQuestions: z
        .array(z.string())
        .max(numFollowUpQuestions)
        .describe('Follow-up questions for deeper research'),
    }),
  });

  return res.object;
}

export async function writeFinalReport({
  prompt,
  learnings,
  visitedUrls,
}: {
  prompt: string;
  learnings: string[];
  visitedUrls: string[];
}) {
  console.log('Writing final report for prompt:', prompt);
  const learningsString = trimPrompt(
    learnings
      .map(learning => `<learning>\n${learning}\n</learning>`)
      .join('\n'),
    150_000,
  );

  const res = await generateObject({
    model: o3MiniModel,
    system: systemPrompt(),
    prompt: `Given the following prompt from the user, write a final report on the topic using the learnings from research. Make it as as detailed as possible, aim for 3 or more pages, include ALL the learnings from research:\n\n<prompt>${prompt}</prompt>\n\nHere are all the learnings from previous research:\n\n<learnings>\n${learningsString}\n</learnings>`,
    schema: z.object({
      reportMarkdown: z
        .string()
        .describe('Final report on the topic in Markdown'),
    }),
  });

  // Append the visited URLs section to the report
  const urlsSection = `\n\n## Sources\n\n${visitedUrls.map(url => `- ${url}`).join('\n')}`;
  const finalReport = res.object.reportMarkdown + urlsSection;
  console.log('Final report generated with', visitedUrls.length, 'sources');
  return finalReport;
}

export async function deepResearch({
  query,
  answers,
  breadth,
  depth,
  learnings = [],
  visitedUrls = [],
  onProgress,
}: {
  query: string;
  answers: string[];
  breadth: number;
  depth: number;
  learnings?: string[];
  visitedUrls?: string[];
  onProgress?: (progress: number, step: string) => void;
}): Promise<ResearchResult> {
  try {
    console.log('Starting deep research:', { query, breadth, depth });
    onProgress?.(10, 'Generating search queries');
    
    const serpQueries = await generateSerpQueries({
      query,
      answers,
      learnings,
      numQueries: Math.min(breadth, 3), // Limit number of queries
    });

    const limit = pLimit(ConcurrencyLimit);
    let currentProgress = 25;
    const progressStep = 50 / (serpQueries.length * depth);

    onProgress?.(currentProgress, 'Searching and analyzing sources');

    const results = await Promise.all(
      serpQueries.map(serpQuery =>
        limit(async () => {
          try {
            console.log('Processing query:', serpQuery.query);
            
            // Add delay between requests
            await delay(RequestDelay);
            
            const result = await firecrawl.search(serpQuery.query, {
              timeout: 15000,
              limit: 3, // Reduce number of results
              scrapeOptions: { formats: ['markdown'] },
            });

            // Collect URLs from this search
            const newUrls = compact(result.data.map(item => item.url));
            const newBreadth = Math.ceil(breadth / 2);
            const newDepth = depth - 1;

            currentProgress += progressStep;
            onProgress?.(
              Math.min(currentProgress, 90),
              'Processing search results'
            );

            const newLearnings = await processSerpResult({
              query: serpQuery.query,
              result,
              numFollowUpQuestions: newBreadth,
            });

            const allLearnings = [...learnings, ...newLearnings.learnings];
            const allUrls = [...visitedUrls, ...newUrls];

            if (newDepth > 0 && newLearnings.followUpQuestions.length > 0) {
              onProgress?.(
                Math.min(currentProgress + progressStep, 90),
                'Researching deeper'
              );
              
              // Take only the first follow-up question to avoid exponential growth
              const nextQuery = `
                Previous research goal: ${serpQuery.researchGoal}
                Follow-up research direction: ${newLearnings.followUpQuestions[0]}
              `.trim();

              return deepResearch({
                query: nextQuery,
                answers,
                breadth: Math.min(newBreadth, 2), // Further limit breadth in deeper levels
                depth: newDepth,
                learnings: allLearnings,
                visitedUrls: allUrls,
                onProgress,
              });
            } else {
              return {
                learnings: allLearnings,
                visitedUrls: allUrls,
              };
            }
          } catch (error) {
            console.error(`Error processing query "${serpQuery.query}":`, error);
            // Return current learnings instead of empty arrays to preserve progress
            return {
              learnings,
              visitedUrls,
            };
          }
        }),
      ),
    );

    onProgress?.(100, 'Research complete');
    
    // Combine and deduplicate results
    const finalResults = {
      learnings: [...new Set(results.flatMap(r => r.learnings))],
      visitedUrls: [...new Set(results.flatMap(r => r.visitedUrls))],
    };

    console.log('Research complete with:', {
      totalLearnings: finalResults.learnings.length,
      totalUrls: finalResults.visitedUrls.length,
    });

    return finalResults;
  } catch (error) {
    console.error('Deep research failed:', error);
    throw error;
  }
} 