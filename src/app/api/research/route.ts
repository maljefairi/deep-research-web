import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { deepResearch, writeFinalReport } from '@/lib/deep-research';

const REPORTS_DIR = path.join(process.cwd(), 'reports');
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_KEY;
const OPENAI_MODEL = process.env.NEXT_PUBLIC_OPENAI_MODEL;
const OPENAI_ENDPOINT = process.env.NEXT_PUBLIC_OPENAI_ENDPOINT || 'https://api.openai.com/v1';

if (!OPENAI_API_KEY) {
  throw new Error('NEXT_PUBLIC_OPENAI_KEY is not set in environment variables');
}

interface ResearchRequest {
  query: string;
  breadth: number;
  depth: number;
  answers?: string[];
}

interface ResearchQuestion {
  id: string;
  question: string;
  goal: string;
  type: 'text' | 'multiline' | 'choice';
  options?: string[];
}

// Function to generate questions based on the query
async function generateQuestionsForQuery(query: string): Promise<ResearchQuestion[]> {
  try {
    const prompt = `Given the following research query, generate 3-5 relevant follow-up questions to better understand the user's needs and context. For each question, also provide a goal explaining why this information is important: "${query}"`;
    
    const response = await fetch(`${OPENAI_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: "You are an expert research assistant helping to generate relevant follow-up questions for a research query. Your questions should help gather important context and details that will make the research more focused and valuable."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate questions');
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }
    
    // Parse the AI response to extract questions
    const questions = content.split('\n')
      .filter((line: string) => line.trim())
      .map((line: string) => {
        // Extract question and goal if provided in format "Q: question (Goal: goal)"
        const match = line.match(/^(?:Q:\s*)?(.+?)(?:\s*\(Goal:\s*(.+?)\))?$/);
        if (match) {
          return {
            id: uuidv4(),
            question: match[1].trim(),
            goal: match[2]?.trim() || 'This helps refine the research focus',
            type: line.toLowerCase().includes('level') || line.toLowerCase().includes('experience') ? 'choice' : 'multiline',
            options: line.toLowerCase().includes('level') || line.toLowerCase().includes('experience') ? 
              ['Beginner', 'Intermediate', 'Advanced', 'Expert'] : undefined
          };
        }
        return null;
      })
      .filter((q: ResearchQuestion | null): q is ResearchQuestion => q !== null);

    return questions;
  } catch (error) {
    console.error('Error generating questions:', error);
    // Return default questions as fallback
    return [
      {
        id: uuidv4(),
        question: 'What specific aspects of this topic interest you the most?',
        goal: 'This helps focus the research on the most relevant areas',
        type: 'multiline',
      },
      {
        id: uuidv4(),
        question: 'What is your current level of knowledge on this topic?',
        goal: 'This helps adjust the depth and complexity of the research',
        type: 'choice',
        options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
      {
        id: uuidv4(),
        question: 'Are there any specific sources or perspectives you want to include or exclude?',
        goal: 'This helps ensure the research aligns with your preferences',
        type: 'multiline',
      },
    ];
  }
}

export async function GET() {
  try {
    const reports = await fs.readdir(REPORTS_DIR);
    const reportData = await Promise.all(
      reports
        .filter(file => file.endsWith('.md') && file !== 'README.md')
        .map(async (filename) => {
          const content = await fs.readFile(
            path.join(REPORTS_DIR, filename),
            'utf-8'
          );
          const id = path.parse(filename).name;
          const title = content.split('\n')[0].replace('# ', '');
          const summary = content.split('\n').slice(1, 3).join(' ').trim();
          
          return {
            id,
            title,
            summary,
            date: (await fs.stat(path.join(REPORTS_DIR, filename))).mtime.toISOString(),
          };
        })
    );

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error reading reports:', error);
    return NextResponse.json({ error: 'Failed to read reports' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: ResearchRequest = await request.json();

    // Create reports directory if it doesn't exist
    try {
      await fs.access(REPORTS_DIR);
    } catch {
      await fs.mkdir(REPORTS_DIR, { recursive: true });
    }

    // If no answers provided, generate dynamic questions based on the query
    if (!data.answers) {
      const questions = await generateQuestionsForQuery(data.query);

      return NextResponse.json({
        status: 'questions',
        questions,
        progress: 5,
      });
    }

    // Process the research with answers
    // Combine the original query with the answers for context
    const combinedQuery = `
Initial Query: ${data.query}
User Context:
${data.answers.map((answer, i) => `- Answer ${i + 1}: ${answer}`).join('\n')}
`;

    // Perform the research
    const { learnings, visitedUrls } = await deepResearch({
      query: combinedQuery,
      answers: data.answers,
      breadth: data.breadth,
      depth: data.depth,
    });

    // Generate the final report
    const reportContent = await writeFinalReport({
      prompt: combinedQuery,
      learnings,
      visitedUrls,
    });

    // Save the report
    const reportId = uuidv4();
    const reportPath = path.join(REPORTS_DIR, `${reportId}.md`);
    await fs.writeFile(reportPath, reportContent);

    // Extract title and summary
    const title = reportContent.split('\n')[0].replace('# ', '').trim();
    const summary = reportContent.split('\n').slice(1, 3).join(' ').trim();

    return NextResponse.json({
      id: reportId,
      title,
      summary,
      report: reportContent,
      learnings,
      visitedUrls,
      progress: 100,
      step: 'Research complete',
    });
  } catch (error) {
    console.error('Research error:', error);
    return NextResponse.json(
      { error: 'Failed to process research request' },
      { status: 500 }
    );
  }
} 