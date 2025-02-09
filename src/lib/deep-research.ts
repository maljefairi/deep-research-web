import FirecrawlApp, { SearchResponse, FirecrawlDocument } from '@mendable/firecrawl-js';
import { generateObject } from 'ai';
import { compact } from 'lodash-es';
import { z } from 'zod';

import { o3MiniModel, trimPrompt } from './ai/providers';
import { systemPrompt } from './prompt';

type ResearchResult = {
  learnings: string[];
  visitedUrls: string[];
};

// Increase delay between requests to avoid rate limits
const InitialRequestDelay = 5000; // 5 seconds initial delay
const MaxRequestDelay = 60000; // Maximum 60 seconds delay
const BackoffFactor = 1.5; // Exponential backoff factor

// Maximum retries for rate-limited requests
const MaxRetries = 2;

// Maximum content length to avoid token limits
const MaxContentLength = 8000;

// Helper function to delay between requests with exponential backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface RateLimitError {
  statusCode: number;
  response?: {
    headers: {
      'retry-after'?: string;
    };
  };
}

// Helper function to handle rate-limited requests with exponential backoff
async function retryWithDelay<T>(
  fn: () => Promise<T>,
  retries = MaxRetries,
  delayMs = InitialRequestDelay
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error && 
        typeof error === 'object' && 
        'statusCode' in error && 
        (error as RateLimitError).statusCode === 429 && 
        retries > 0) {
      // Get retry delay from response headers if available
      const rateLimitError = error as RateLimitError;
      const retryAfter = rateLimitError.response?.headers?.['retry-after'];
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
}: {
  query: string;
  result: SearchResponse;
}) {
  console.log('Processing SERP results for query:', query);
  
  // Ensure content exists in FirecrawlDocument
  const combinedContent = result.data
    .map(item => (item as FirecrawlDocument & { content: string }).content)
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
          .max(1)
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
  try {
    const res = await generateObject({
      model: o3MiniModel,
      system: systemPrompt(),
      prompt: `Given the research topic and preliminary answers, create a detailed research plan with a table of contents. The plan should be comprehensive and well-structured.

Topic: <topic>${query}</topic>

Preliminary Answers:
${answers.map((answer, i) => `${i + 1}. ${answer}`).join('\n')}

Create a research plan that includes:
1. A clear title for the research
2. Main sections with specific headings
3. Relevant subheadings for each section
4. Specific research queries for each section
5. Estimated research depth (1-5) where 1 is surface level and 5 is very detailed
6. Estimated research breadth (3-10) where 3 is focused and 10 is comprehensive

IMPORTANT: You must include both estimatedDepth and estimatedBreadth as numbers in your response.
The depth should be between 1-5 and breadth between 3-10.

Format your response exactly as follows:
{
  "tableOfContents": {
    "title": "Your Title Here",
    "sections": [
      {
        "heading": "Section Heading",
        "subheadings": ["Subheading 1", "Subheading 2"],
        "researchQueries": ["Query 1", "Query 2"]
      }
    ]
  },
  "estimatedDepth": 3,
  "estimatedBreadth": 6
}`,
      schema: z.object({
        tableOfContents: z.object({
          title: z.string(),
          sections: z.array(z.object({
            heading: z.string(),
            subheadings: z.array(z.string()),
            researchQueries: z.array(z.string()),
          })),
        }).strict(),
        estimatedDepth: z.number().int().min(1).max(5),
        estimatedBreadth: z.number().int().min(3).max(10),
      }).strict(),
    });

    // Validate the response structure
    if (!res.object.tableOfContents || !Array.isArray(res.object.tableOfContents.sections)) {
      throw new Error('Invalid research plan structure');
    }

    // Validate depth and breadth
    if (typeof res.object.estimatedDepth !== 'number' || typeof res.object.estimatedBreadth !== 'number') {
      console.warn('Missing depth or breadth, using defaults');
      return {
        ...res.object,
        estimatedDepth: res.object.estimatedDepth || 3,
        estimatedBreadth: res.object.estimatedBreadth || 6,
      };
    }

    return res.object;
  } catch (error) {
    console.error('Research plan generation error:', error);
    // Provide a fallback research plan
    return {
      tableOfContents: {
        title: `Research Plan: ${query}`,
        sections: [
          {
            heading: 'Introduction',
            subheadings: ['Overview', 'Background'],
            researchQueries: [`What is ${query}?`, `Current state of ${query}`],
          },
          {
            heading: 'Main Analysis',
            subheadings: ['Key Aspects', 'Findings'],
            researchQueries: [`Analysis of ${query}`, `Key findings about ${query}`],
          },
          {
            heading: 'Conclusion',
            subheadings: ['Summary', 'Recommendations'],
            researchQueries: [`Summary of ${query}`, `Recommendations regarding ${query}`],
          },
        ],
      },
      estimatedDepth: 3,
      estimatedBreadth: 6,
    };
  }
}

// Modify the deepResearch function to handle sections sequentially
export async function deepResearch({
  query,
  breadth,
  depth,
  researchPlan,
  learnings = [],
  visitedUrls = [],
  onProgress,
}: {
  query: string;
  answers?: string[];
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
    for (let i = 0; i < researchPlan.tableOfContents.sections.length; i++) {
      const section = researchPlan.tableOfContents.sections[i];
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
      currentProgress = ((i + 1) / totalSections) * 100;
      onProgress?.(
        currentProgress,
        `Completed section: ${section.heading}`
      );
    }

    // Combine all results
    const finalResults = {
      learnings: Array.from(new Set([
        ...learnings,
        ...results.flatMap(result => result.learnings)
      ])),
      visitedUrls: Array.from(new Set([
        ...visitedUrls,
        ...results.flatMap(result => result.visitedUrls)
      ])),
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