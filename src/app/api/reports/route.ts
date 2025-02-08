import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const REPORTS_DIR = path.join(process.cwd(), 'final_reports');

// Ensure reports directory exists
fs.mkdir(REPORTS_DIR, { recursive: true, mode: 0o755 }).catch(console.error);

export async function GET() {
  try {
    // Read all files in the reports directory
    const files = await fs.readdir(REPORTS_DIR);
    
    // Get metadata for each report
    const reports = await Promise.all(
      files
        .filter(file => file.endsWith('.md'))
        .map(async (file) => {
          const filePath = path.join(REPORTS_DIR, file);
          const content = await fs.readFile(filePath, 'utf-8');
          
          // Extract title and summary from content
          const lines = content.split('\n');
          const title = lines[0].replace(/^#\s+/, '').trim();
          const summary = lines.slice(1).find(line => line.trim().length > 0)?.trim() || 'Research findings';
          
          return {
            id: path.basename(file, '.md'),
            title,
            summary,
            date: (await fs.stat(filePath)).mtime.toISOString(),
          };
        })
    );
    
    // Sort reports by date, most recent first
    reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error retrieving reports:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve reports' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    const filePath = path.join(REPORTS_DIR, `${id}.md`);
    await fs.unlink(filePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
} 