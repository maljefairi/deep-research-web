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
const RequestDelay = 15000; // 15 seconds delay between requests to respect rate limits

// Maximum retries for rate-limited requests
const MaxRetries = 3;

// Maximum content length to avoid token limits
const MaxContentLength = 8000;

// Add maximum limits to prevent infinite loops
const MAX_TOTAL_QUERIES = 15;
const MAX_DEPTH_ITERATIONS = 3;
const MAX_RETRIES = 3;

// Helper function to delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to handle rate-limited requests with retries
async function retryWithDelay<T>(
  fn: () => Promise<T>,
  retries = MaxRetries,
  delayMs = RequestDelay
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (error?.statusCode === 429 && retries > 0) {
      console.log(`Rate limited, retrying in ${delayMs}ms... (${retries} retries left)`);
      await delay(delayMs);
      return retryWithDelay(fn, retries - 1, delayMs * 1.5);
    }
    throw error;
  }
}

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
    prompt: `Given the following research topic, generate 3-4 focused questions that need to be answered before starting the research. These questions should help clarify:
1. The specific goals or outcomes desired
2. Any specific industries, companies, or examples to focus on
3. Any constraints or preferences to consider
4. Any specific aspects that need deeper investigation

Topic: <topic>${query}</topic>

Generate questions that will help refine and focus the research. Each question should have:
- A clear goal explaining why this information is important
- Be specific and targeted
- Help narrow down the scope of research`,
    schema: z.object({
      questions: z
        .array(
          z.object({
            id: z.string().describe('Unique identifier for the question'),
            question: z.string().describe('The question to ask'),
            goal: z.string().describe('Why this question is important for the research'),
            type: z.enum(['text', 'multiline', 'choice']).describe('Type of question (text, multiline, or choice)'),
            options: z.array(z.string()).optional().describe('Options for choice questions'),
          }),
        )
        .min(2)
        .max(4)
        .describe('List of questions to ask before starting research'),
    }),
  });

  return res.object.questions.map(q => ({
    ...q,
    id: q.id || Math.random().toString(36).substring(7),
  }));
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

// Track research progress
interface ResearchProgress {
  learnings: string[];
  visitedUrls: string[];
  totalQueries: number;
  depthIterations: number;
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

  try {
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
          .max(1) // Limit to 1 follow-up question to prevent exponential growth
          .describe('Follow-up questions for deeper research'),
      }),
    });

    return res.object;
  } catch (error) {
    console.error(`Error processing SERP result for query "${query}":`, error);
    return {
      learnings: [],
      followUpQuestions: [],
    };
  }
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

interface ResearchPlan {
  tableOfContents: {
    title: string;
    sections: {
      heading: string;
      subheadings: string[];
      researchQueries: string[];
    }[];
  };
  estimatedDepth: number;
  estimatedBreadth: number;
}

// Generate research plan with table of contents
export async function generateResearchPlan({
  query,
  answers,
}: {
  query: string;
  answers: string[];
}): Promise<ResearchPlan> {
  console.log('Generating research plan for:', query);
  const res = await generateObject({
    model: o3MiniModel,
    system: systemPrompt(),
    prompt: `Given the research topic and preliminary answers, create a detailed research plan with a table of contents. The plan should be comprehensive and well-structured.

Topic: <topic>${query}</topic>

Preliminary Answers:
${answers.map((answer, i) => `${i + 1}. ${answer}`).join('\n')}

Create a research plan that:
1. Has a clear structure with main sections and subsections
2. Includes specific research queries for each section
3. Suggests optimal research depth and breadth
4. Ensures comprehensive coverage of the topic`,
    schema: z.object({
      tableOfContents: z.object({
        title: z.string(),
        sections: z.array(z.object({
          heading: z.string(),
          subheadings: z.array(z.string()),
          researchQueries: z.array(z.string()).describe('Specific search queries to research this section'),
        })),
      }),
      estimatedDepth: z.number().min(1).max(5),
      estimatedBreadth: z.number().min(3).max(10),
    }),
  });

  return res.object;
}

// Modify the deepResearch function to use the research plan
export async function deepResearch({
  query,
  answers,
  breadth,
  depth,
  researchPlan,
  learnings = [],
  visitedUrls = [],
  onProgress,
}: {
  query: string;
  answers: string[];
  breadth: number;
  depth: number;
  researchPlan: ResearchPlan;
  learnings?: string[];
  visitedUrls?: string[];
  onProgress?: (progress: number, step: string) => void;
}): Promise<ResearchResult> {
  try {
    console.log('Starting deep research with plan:', { query, breadth, depth });
    
    onProgress?.(10, 'Starting research based on plan...');
    
    const totalSections = researchPlan.tableOfContents.sections.length;
    let currentProgress = 10;
    const progressPerSection = 80 / totalSections;

    const results = await Promise.all(
      researchPlan.tableOfContents.sections.map(async (section, sectionIndex) => {
        onProgress?.(
          currentProgress,
          `Researching section: ${section.heading}`
        );

        const sectionResults = await Promise.all(
          section.researchQueries.map(async (query) => {
            try {
              await delay(RequestDelay);
              
              const result = await retryWithDelay(() => 
                firecrawl.search(query, {
                  timeout: 15000,
                  limit: 3,
                  scrapeOptions: { formats: ['markdown'] },
                })
              );

              const newUrls = compact(result.data.map(item => item.url));
              const newLearnings = await processSerpResult({
                query,
                result,
                numFollowUpQuestions: 1,
              });

              return {
                learnings: newLearnings.learnings,
                visitedUrls: newUrls,
              };
            } catch (error) {
              console.error(`Error processing query "${query}":`, error);
              return { learnings: [], visitedUrls: [] };
            }
          })
        );

        currentProgress += progressPerSection;
        onProgress?.(
          Math.min(currentProgress, 90),
          `Completed section: ${section.heading}`
        );

        return sectionResults;
      })
    );

    // Combine all results
    const finalResults = {
      learnings: [
        ...learnings,
        ...new Set(results.flatMap(sectionResults => 
          sectionResults.flatMap(result => result.learnings)
        )),
      ],
      visitedUrls: [
        ...visitedUrls,
        ...new Set(results.flatMap(sectionResults => 
          sectionResults.flatMap(result => result.visitedUrls)
        )),
      ],
    };

    console.log('Research complete with:', {
      totalLearnings: finalResults.learnings.length,
      totalUrls: finalResults.visitedUrls.length,
      totalSections: totalSections,
    });

    return finalResults;
  } catch (error) {
    console.error('Deep research failed:', error);
    throw error;
  }
} 