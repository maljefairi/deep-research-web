import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const deepResearchPath = path.join(process.cwd(), '..', 'deep-research');
    const filePath = path.join(deepResearchPath, params.filename);

    // Security check to prevent directory traversal
    if (!filePath.startsWith(deepResearchPath) || !filePath.endsWith('.md')) {
      return NextResponse.json(
        { error: 'Invalid file request' },
        { status: 400 }
      );
    }

    const content = await readFile(filePath, 'utf-8');
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${params.filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }
} 