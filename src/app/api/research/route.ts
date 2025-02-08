import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const REPORTS_DIR = path.join(process.cwd(), 'reports');

// Ensure reports directory exists
fs.mkdir(REPORTS_DIR, { recursive: true }).catch(console.error);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, summary, date } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Report content is required' },
        { status: 400 }
      );
    }

    // Generate unique ID for the report
    const reportId = uuidv4();
    const reportFileName = `${reportId}.md`;
    const reportPath = path.join(REPORTS_DIR, reportFileName);

    try {
      // Save the report content
      await fs.writeFile(reportPath, content, 'utf-8');

      // Create and return report metadata
      const report = {
        id: reportId,
        title: title || 'Research Report',
        summary: summary || 'Research findings',
        date: date || new Date().toISOString(),
        content,
      };

      return NextResponse.json(report);
    } catch (error) {
      console.error('Error saving report:', error);
      return NextResponse.json(
        { error: 'Failed to save report to disk' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing report:', error);
    return NextResponse.json(
      { error: 'Failed to process report' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get list of report files
    const files = await fs.readdir(REPORTS_DIR);
    const reports = await Promise.all(
      files
        .filter(file => file.endsWith('.md'))
        .map(async file => {
          const content = await fs.readFile(
            path.join(REPORTS_DIR, file),
            'utf-8'
          );
          const id = file.replace('.md', '');
          const lines = content.split('\n');
          const title = lines[0].replace(/^#\s+/, '').trim();
          const summary = lines.slice(1).find(line => line.trim().length > 0)?.trim() || 'Research findings';

          return {
            id,
            title,
            summary,
            date: new Date().toISOString(), // You might want to store this in the file metadata
            content,
          };
        })
    );

    // Sort by date, newest first
    return NextResponse.json(
      reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
} 