import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const REPORTS_DIR = path.join(process.cwd(), 'reports');

export async function GET(
  request: NextRequest,
  context: { params: { filename: string } }
) {
  try {
    // Ensure the filename is provided and sanitized
    const filename = context.params?.filename;
    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      );
    }

    // Prevent directory traversal attacks
    const sanitizedFilename = path.normalize(filename).replace(/^(\.\.(\/|\\))+/, '');
    const filePath = path.join(REPORTS_DIR, sanitizedFilename);

    // Check if the file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Read and return the file
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Set appropriate headers for markdown content
    const headers = new Headers();
    headers.set('Content-Type', 'text/markdown; charset=utf-8');
    headers.set('Content-Disposition', `inline; filename="${sanitizedFilename}"`);

    return new NextResponse(content, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error reading report:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to read report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { filename: string } }
) {
  try {
    // Ensure the filename is provided and sanitized
    const filename = context.params?.filename;
    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      );
    }

    // Prevent directory traversal attacks
    const sanitizedFilename = path.normalize(filename).replace(/^(\.\.(\/|\\))+/, '');
    const filePath = path.join(REPORTS_DIR, `${sanitizedFilename}.md`);

    // Check if the file exists
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
    console.error('Error deleting report:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to delete report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Create the reports directory if it doesn't exist
fs.mkdir(REPORTS_DIR, { recursive: true }).catch(error => {
  console.error('Error creating reports directory:', error instanceof Error ? error.message : 'Unknown error');
}); 