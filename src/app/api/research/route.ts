import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { readFile, readdir } from 'fs/promises';
import path from 'path';

// Function to get all existing research reports
async function getExistingReports(deepResearchPath: string) {
  try {
    const files = await readdir(deepResearchPath);
    const reports = files
      .filter(file => file.endsWith('.md') && file !== 'README.md')
      .map(async file => {
        const content = await readFile(path.join(deepResearchPath, file), 'utf-8');
        const firstLine = content.split('\n')[0] || 'Untitled Research';
        return {
          filename: file,
          title: firstLine.replace('#', '').trim(),
          path: path.join(deepResearchPath, file),
          date: new Date((await readFile(path.join(deepResearchPath, file))).mtime).toISOString()
        };
      });
    return await Promise.all(reports);
  } catch (error) {
    console.error('Error reading reports:', error);
    return [];
  }
}

export async function GET() {
  try {
    const deepResearchPath = path.join(process.cwd(), '..', 'deep-research');
    const reports = await getExistingReports(deepResearchPath);
    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { query, breadth, depth } = await request.json();
    const deepResearchPath = path.join(process.cwd(), '..', 'deep-research');

    return new Promise((resolve) => {
      const childProcess = spawn('npm', ['start'], {
        cwd: deepResearchPath,
        env: {
          ...process.env,
          PIPE_MODE: 'true',
        },
      });

      // Write the inputs to the process
      childProcess.stdin.write(`${query}\n`);
      childProcess.stdin.write(`${breadth}\n`);
      childProcess.stdin.write(`${depth}\n`);

      let output = '';
      childProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      childProcess.stderr.on('data', (data) => {
        console.error(`Error: ${data}`);
      });

      childProcess.on('close', async (code) => {
        if (code !== 0) {
          resolve(
            NextResponse.json(
              { error: 'Research process failed' },
              { status: 500 }
            )
          );
          return;
        }

        try {
          // Read the output.md file
          const reportPath = path.join(deepResearchPath, 'output.md');
          const report = await readFile(reportPath, 'utf-8');
          
          // Get updated list of reports
          const reports = await getExistingReports(deepResearchPath);

          resolve(
            NextResponse.json({
              success: true,
              output,
              report,
              reports
            })
          );
        } catch (error) {
          resolve(
            NextResponse.json(
              { error: 'Failed to read research results' },
              { status: 500 }
            )
          );
        }
      });
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
} 