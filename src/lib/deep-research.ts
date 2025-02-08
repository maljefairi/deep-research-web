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
const InitialRequestDelay = 5000; // 5 seconds initial delay
const MaxRequestDelay = 60000; // Maximum 60 seconds delay
const BackoffFactor = 1.5; // Exponential backoff factor

// Maximum retries for rate-limited requests
const MaxRetries = 2;

// Maximum content length to avoid token limits
const MaxContentLength = 8000;

// Add maximum limits to prevent infinite loops
const MAX_TOTAL_QUERIES = 15;
const MAX_DEPTH_ITERATIONS = 3;
const MAX_RETRIES = 3;

// Helper function to delay between requests with exponential backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to handle rate-limited requests with exponential backoff
async function retryWithDelay<T>(
  fn: () => Promise<T>,
  retries = MaxRetries,
  delayMs = InitialRequestDelay
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (error?.statusCode === 429 && retries > 0) {
      // Get retry delay from response headers if available
      const retryAfter = error.response?.headers?.['retry-after'];
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delayMs;
      
      console.log(`Rate limited, waiting ${waitTime/1000}s before retry... (${retries} retries left)`);
      await delay(waitTime);
      
      // Calculate next delay with exponential backoff, but don't exceed max delay
      const nextDelay = Math.min(delayMs * BackoffFactor, MaxRequestDelay);
      
      return retryWithDelay(fn, retries - 1, nextDelay);
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
3. Provides estimated optimal research depth (1-5) and breadth (3-10)
4. Ensures comprehensive coverage of the topic

Note: The depth should be between 1-5 (where 1 is surface level and 5 is very detailed),
and breadth should be between 3-10 (where 3 is focused and 10 is comprehensive).
These estimates should be based on the complexity and scope of the research topic.`,
    schema: z.object({
      tableOfContents: z.object({
        title: z.string(),
        sections: z.array(z.object({
          heading: z.string(),
          subheadings: z.array(z.string()),
          researchQueries: z.array(z.string()).describe('Specific search queries to research this section'),
        })),
      }),
      estimatedDepth: z.number().min(1).max(5).describe('Estimated optimal research depth (1-5)'),
      estimatedBreadth: z.number().min(3).max(10).describe('Estimated optimal research breadth (3-10)'),
    }),
  });

  // Validate the response
  if (!res.object.estimatedDepth || !res.object.estimatedBreadth) {
    throw new Error('Invalid research plan: missing depth or breadth estimates');
  }

  return res.object;
}

// Modify the deepResearch function to handle sections sequentially
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
    
    const totalSections = researchPlan.tableOfContents.sections.length;
    let currentProgress = 0;
    
    const results = [];
    
    // Process sections sequentially to avoid rate limits
    for (const [sectionIndex, section] of researchPlan.tableOfContents.sections.entries()) {
      onProgress?.(
        currentProgress,
        `Researching section: ${section.heading}`
      );

      // Process queries for this section sequentially
      for (const query of section.researchQueries) {
        try {
          // Add delay between queries
          await delay(InitialRequestDelay);
          
          const result = await retryWithDelay(() => 
            firecrawl.search(query, {
              timeout: 30000,
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

          results.push({
            learnings: newLearnings.learnings,
            visitedUrls: newUrls,
          });
        } catch (error) {
          console.error(`Error processing query "${query}":`, error);
          // Continue with next query even if this one fails
        }
      }

      // Update progress after each section
      currentProgress = ((sectionIndex + 1) / totalSections) * 100;
      onProgress?.(
        currentProgress,
        `Completed section: ${section.heading}`
      );
    }

    // Combine all results
    const finalResults = {
      learnings: [
        ...learnings,
        ...new Set(results.flatMap(result => result.learnings)),
      ],
      visitedUrls: [
        ...visitedUrls,
        ...new Set(results.flatMap(result => result.visitedUrls)),
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