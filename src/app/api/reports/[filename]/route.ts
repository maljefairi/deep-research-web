import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const reportsDir = path.join(process.cwd(), 'reports');
    const filePath = path.join(reportsDir, params.filename);

    // Security check to prevent directory traversal
    if (!filePath.startsWith(reportsDir) || !filePath.endsWith('.md')) {
      console.error('Invalid file request:', filePath);
      return NextResponse.json(
        { error: 'Invalid file request' },
        { status: 400 }
      );
    }

    console.log('Reading report file:', filePath);
    const content = await readFile(filePath, 'utf-8');
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${params.filename}"`,
      },
    });
  } catch (error) {
    console.error('Failed to read report:', error);
    return NextResponse.json(
      { 
        error: 'File not found',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 404 }
    );
  }
} 