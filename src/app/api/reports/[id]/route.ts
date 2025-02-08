import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const REPORTS_DIR = path.join(process.cwd(), 'final_reports');

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const filePath = path.join(REPORTS_DIR, `${id}.md`);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }
    
    // Read report content
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const title = lines[0].replace(/^#\s+/, '').trim();
    const summary = lines.slice(1).find(line => line.trim().length > 0)?.trim() || 'Research findings';
    
    return NextResponse.json({
      id,
      title,
      summary,
      content,
      date: (await fs.stat(filePath)).mtime.toISOString(),
    });
  } catch (error) {
    console.error('Error retrieving report:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve report' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const filePath = path.join(REPORTS_DIR, `${id}.md`);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }
    
    // Delete the file
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