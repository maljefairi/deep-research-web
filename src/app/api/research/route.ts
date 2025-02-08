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

    // Verify deep-research directory exists
    try {
      await readdir(deepResearchPath);
    } catch (error) {
      console.error('Deep research directory not found:', error);
      return NextResponse.json(
        { error: 'Deep research backend not found' },
        { status: 500 }
      );
    }

    return new Promise((resolve) => {
      // Start the deep-research process
      const childProcess = spawn('node', ['src/run.ts'], {
        cwd: deepResearchPath,
        env: {
          ...process.env,
          PIPE_MODE: 'true',
        },
        shell: true
      });

      let stdoutData = '';
      let stderrData = '';

      // Handle process output
      childProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdoutData += output;
        console.log('Research output:', output);
      });

      childProcess.stderr.on('data', (data) => {
        const error = data.toString();
        stderrData += error;
        console.error('Research error:', error);
      });

      // Write inputs when prompted
      childProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('What would you like to research?')) {
          childProcess.stdin.write(query + '\n');
        } else if (output.includes('Enter research breadth')) {
          childProcess.stdin.write(breadth + '\n');
        } else if (output.includes('Enter research depth')) {
          childProcess.stdin.write(depth + '\n');
        }
      });

      // Handle process completion
      childProcess.on('close', async (code) => {
        console.log('Research process exited with code:', code);
        
        if (code !== 0) {
          console.error('Research failed with stderr:', stderrData);
          resolve(
            NextResponse.json(
              { 
                error: 'Research process failed',
                details: stderrData
              },
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
              output: stdoutData,
              report,
              reports
            })
          );
        } catch (error) {
          console.error('Failed to read research results:', error);
          resolve(
            NextResponse.json(
              { 
                error: 'Failed to read research results',
                details: error instanceof Error ? error.message : 'Unknown error'
              },
              { status: 500 }
            )
          );
        }
      });

      // Handle process errors
      childProcess.on('error', (error) => {
        console.error('Failed to start research process:', error);
        resolve(
          NextResponse.json(
            { 
              error: 'Failed to start research process',
              details: error.message
            },
            { status: 500 }
          )
        );
      });
    });
  } catch (error) {
    console.error('Request processing error:', error);
    return NextResponse.json(
      { 
        error: 'Invalid request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    );
  }
} 