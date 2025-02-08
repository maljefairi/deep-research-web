import { NextResponse } from 'next/server';
import { readFile, readdir, stat, mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { deepResearch, writeFinalReport, generateInitialQuestions } from '@/lib/deep-research';

// Function to get all existing research reports
async function getExistingReports(reportsDir: string) {
  try {
    const files = await readdir(reportsDir);
    const reports = await Promise.all(
      files
        .filter(file => file.endsWith('.md') && file !== 'README.md')
        .map(async file => {
          const filePath = path.join(reportsDir, file);
          const stats = await stat(filePath);
          const content = await readFile(filePath, 'utf-8');
          const firstLine = content.split('\n')[0] || 'Untitled Research';
          return {
            filename: file,
            title: firstLine.replace('#', '').trim(),
            path: filePath,
            date: stats.mtime.toISOString()
          };
        })
    );
    return reports;
  } catch (error) {
    console.error('Error reading reports:', error);
    return [];
  }
}

export async function GET() {
  try {
    const reportsDir = path.join(process.cwd(), 'reports');
    console.log('Reports directory:', reportsDir);

    // Create reports directory if it doesn't exist
    try {
      await readdir(reportsDir);
    } catch (error) {
      console.log('Creating reports directory...');
      await mkdir(reportsDir, { recursive: true });
    }

    const reports = await getExistingReports(reportsDir);
    console.log('Found reports:', reports);

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch reports',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let currentProgress = 0;
  let currentStep = '';

  try {
    const body = await request.json();
    const { query, breadth, depth, answers } = body;

    if (!query) {
      throw new Error('Missing required parameter: query');
    }

    // If no answers provided, generate initial questions
    if (!answers) {
      console.log('Generating initial questions for:', query);
      try {
        const questions = await generateInitialQuestions(query);
        return NextResponse.json({
          status: 'questions',
          questions,
          progress: 5,
          step: 'Gathering initial information',
        });
      } catch (error) {
        console.error('Failed to generate questions:', error);
        throw new Error('Failed to generate initial questions. Please try again.');
      }
    }

    // Validate research parameters
    if (!breadth || !depth) {
      throw new Error('Missing required parameters: breadth and depth are required');
    }

    if (breadth < 3 || breadth > 10) {
      throw new Error('Breadth must be between 3 and 10');
    }

    if (depth < 1 || depth > 5) {
      throw new Error('Depth must be between 1 and 5');
    }

    const reportsDir = path.join(process.cwd(), 'reports');
    console.log('Processing research request:', { query, breadth, depth, answers });

    // Create reports directory if it doesn't exist
    try {
      await readdir(reportsDir);
    } catch (error) {
      console.log('Creating reports directory...');
      await mkdir(reportsDir, { recursive: true });
    }

    const { learnings, visitedUrls } = await deepResearch({
      query,
      answers,
      breadth,
      depth,
      onProgress: (progress, step) => {
        currentProgress = progress;
        currentStep = step;
        console.log(`Research progress: ${progress}% - ${step}`);
      }
    });

    if (!learnings.length) {
      throw new Error('No results found. Please try adjusting your search parameters or try again later.');
    }

    // Generate the final report
    console.log('Generating final report...');
    try {
      const report = await writeFinalReport({
        prompt: query,
        learnings,
        visitedUrls
      });

      // Save the report
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `research-${timestamp}.md`;
      const reportPath = path.join(reportsDir, filename);
      await writeFile(reportPath, report, 'utf-8');
      console.log('Report saved:', reportPath);

      // Get updated list of reports
      const reports = await getExistingReports(reportsDir);

      return NextResponse.json({
        status: 'complete',
        success: true,
        report,
        reports,
        progress: 100,
        step: 'Research complete',
        learnings,
        visitedUrls
      });
    } catch (error) {
      console.error('Failed to generate final report:', error);
      // Return partial results even if report generation fails
      return NextResponse.json({
        status: 'partial',
        success: true,
        learnings,
        visitedUrls,
        progress: currentProgress,
        step: 'Research completed but report generation failed',
      });
    }
  } catch (error) {
    console.error('Research failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Research process failed';
    const isRateLimit = errorMessage.toLowerCase().includes('rate limit');
    
    return NextResponse.json(
      { 
        status: 'error',
        error: errorMessage,
        details: isRateLimit 
          ? 'The research service is temporarily busy. Please wait 30-60 seconds and try again.'
          : error instanceof Error ? error.message : 'Unknown error',
        progress: currentProgress,
        step: currentStep || 'Error'
      },
      { 
        status: isRateLimit ? 429 : 500 
      }
    );
  }
} 