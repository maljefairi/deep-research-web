import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { deepResearch, writeFinalReport, generateInitialQuestions } from '@/lib/deep-research';

const REPORTS_DIR = path.join(process.cwd(), 'reports');

interface ResearchRequest {
  query: string;
  breadth: number;
  depth: number;
}

interface ResearchReport {
  id: string;
  title: string;
  date: string;
  summary: string;
  content: string;
}

// Function to get all existing research reports
async function getExistingReports(reportsDir: string) {
  try {
    const files = await fs.readdir(reportsDir);
    const reports = await Promise.all(
      files
        .filter(file => file.endsWith('.md') && file !== 'README.md')
        .map(async file => {
          const filePath = path.join(reportsDir, file);
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf-8');
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
    // Create reports directory if it doesn't exist
    await fs.mkdir(REPORTS_DIR, { recursive: true });

    // Read all report files
    const files = await fs.readdir(REPORTS_DIR);
    const reports: ResearchReport[] = [];

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(REPORTS_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const id = path.basename(file, '.md');

      // Extract title and date from the first line of content
      const lines = content.split('\n');
      const title = lines[0].replace('# ', '').trim();
      const summary = lines.find(line => line.startsWith('## Summary'))?.split('\n')[1]?.trim() || 'No summary available';

      reports.push({
        id,
        title,
        date: new Date().toISOString(), // In a real app, store this in the file or filename
        summary,
        content,
      });
    }

    // Sort by date, most recent first
    reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Return reports without content
    return NextResponse.json({
      reports: reports.map(({ content, ...metadata }) => metadata),
    });
  } catch (error) {
    console.error('Error reading reports:', error);
    return NextResponse.json(
      { error: 'Failed to read reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json() as ResearchRequest;

    // Validate request data
    if (!data.query || !data.breadth || !data.depth) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (data.breadth < 3 || data.breadth > 10) {
      return NextResponse.json(
        { error: 'Breadth must be between 3 and 10' },
        { status: 400 }
      );
    }

    if (data.depth < 1 || data.depth > 5) {
      return NextResponse.json(
        { error: 'Depth must be between 1 and 5' },
        { status: 400 }
      );
    }

    // TODO: Implement actual research logic here
    // For now, return a mock response
    const report: ResearchReport = {
      id: uuidv4(),
      title: data.query,
      date: new Date().toISOString(),
      summary: `Research on "${data.query}" with breadth ${data.breadth} and depth ${data.depth}`,
      content: `# ${data.query}\n\n## Summary\n\nThis is a mock research report.\n\n## Details\n\n- Breadth: ${data.breadth}\n- Depth: ${data.depth}\n\n## Results\n\nTo be implemented.`,
    };

    // Save the report
    const filename = `${report.id}.md`;
    const filePath = path.join(REPORTS_DIR, filename);
    await fs.writeFile(filePath, report.content, 'utf-8');

    // Return the report metadata (without content)
    const { content, ...metadata } = report;
    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Research error:', error);
    return NextResponse.json(
      { error: 'Failed to process research request' },
      { status: 500 }
    );
  }
} 