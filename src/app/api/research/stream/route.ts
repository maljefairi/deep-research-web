import { NextRequest } from 'next/server';
import { deepResearch, writeFinalReport, generateResearchPlan } from '@/lib/deep-research';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const REPORTS_DIR = path.join(process.cwd(), 'final_reports');

// Ensure reports directory exists with proper permissions
fs.mkdir(REPORTS_DIR, { recursive: true, mode: 0o755 }).catch(console.error);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  const breadth = searchParams.get('breadth');
  const depth = searchParams.get('depth');
  const answers = searchParams.get('answers');

  if (!query || !breadth || !depth || !answers) {
    return new Response('Missing parameters', { status: 400 });
  }

  // Set up Server-Sent Events
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendUpdate = async (data: any) => {
    await writer.write(
      encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
    );
  };

  // Start research process
  (async () => {
    try {
      await sendUpdate({
        progress: 5,
        step: 'Starting research...',
        logs: ['Initializing research process...'],
      });

      // Decode base64 answers and parse JSON
      let parsedAnswers;
      try {
        if (!answers) {
          throw new Error('No answers provided');
        }

        // Remove any whitespace and quotes that might have been added
        const cleanedAnswers = answers.replace(/\s/g, '').replace(/^["']|["']$/g, '');
        
        // First decode from base64
        let decodedBase64;
        try {
          decodedBase64 = atob(cleanedAnswers);
        } catch (e) {
          console.error('Base64 decode error:', e);
          throw new Error('Invalid base64 encoding');
        }
        
        // Then decode URI components
        let decodedUri;
        try {
          decodedUri = decodeURIComponent(decodedBase64);
        } catch (e) {
          console.error('URI decode error:', e);
          throw new Error('Invalid URI encoding');
        }
        
        // Finally parse JSON
        try {
          parsedAnswers = JSON.parse(decodedUri);
        } catch (e) {
          console.error('JSON parse error:', e);
          throw new Error('Invalid JSON format');
        }

        // Validate the answers array
        if (!Array.isArray(parsedAnswers)) {
          throw new Error('Answers must be an array');
        }

        if (parsedAnswers.length === 0) {
          throw new Error('No answers provided');
        }

        if (!parsedAnswers.every(answer => typeof answer === 'string' && answer.trim().length > 0)) {
          throw new Error('All answers must be non-empty strings');
        }

        console.log('Successfully decoded answers:', parsedAnswers);
      } catch (error) {
        console.error('Error parsing answers:', error);
        throw new Error(
          error instanceof Error 
            ? `Invalid answers format - ${error.message}` 
            : 'Invalid answers format - Please check your input and try again'
        );
      }

      // Generate research plan
      await sendUpdate({
        progress: 10,
        step: 'Generating research plan...',
        logs: ['Creating table of contents and research structure...'],
      });

      let researchPlan;
      try {
        researchPlan = await generateResearchPlan({
          query,
          answers: parsedAnswers,
        });

        // Send the research plan to the client
        await sendUpdate({
          progress: 15,
          step: 'Research plan generated',
          logs: [
            'Research plan created successfully',
            `Title: ${researchPlan.tableOfContents.title}`,
            `Estimated Depth: ${researchPlan.estimatedDepth}`,
            `Estimated Breadth: ${researchPlan.estimatedBreadth}`,
            'Sections:',
            ...researchPlan.tableOfContents.sections.map(s => `- ${s.heading}`),
          ],
          researchPlan,
        });
      } catch (error) {
        console.error('Error generating research plan:', error);
        throw new Error(
          'Failed to generate research plan - ' + 
          (error instanceof Error ? error.message : 'Please try again with more specific research parameters')
        );
      }

      // Start the actual research based on the plan
      const { learnings, visitedUrls } = await deepResearch({
        query,
        answers: parsedAnswers,
        breadth: parseInt(breadth),
        depth: parseInt(depth),
        researchPlan,
        onProgress: async (progress: number, step: string) => {
          await sendUpdate({
            progress: Math.min(15 + (progress * 0.75), 90), // Scale progress to leave room for final steps
            step,
            logs: [`${step} (${progress}%)`],
          });
        },
      });

      await sendUpdate({
        progress: 90,
        step: 'Generating final report...',
        learnings,
        visitedUrls,
        logs: ['Analyzing research findings...'],
      });

      // Generate the final report
      const reportContent = await writeFinalReport({
        prompt: query,
        learnings,
        visitedUrls,
      });

      // Extract title and first paragraph as summary
      const lines = reportContent.split('\n');
      const title = lines[0].replace(/^#\s+/, '').trim();
      const summary = lines.slice(1).find(line => line.trim().length > 0)?.trim() || 'Research findings';

      // Save the report
      const reportId = uuidv4();
      const reportFileName = `${reportId}.md`;
      const reportPath = path.join(REPORTS_DIR, reportFileName);

      try {
        await fs.writeFile(reportPath, reportContent, 'utf-8');
        console.log('Report saved:', reportPath);

        // Create report metadata
        const reportMeta = {
          id: reportId,
          title,
          summary,
          date: new Date().toISOString(),
          content: reportContent,
        };

        // Send final update with report
        await sendUpdate({
          progress: 100,
          step: 'Research complete',
          report: reportContent,
          title,
          summary,
          learnings,
          visitedUrls,
          logs: ['Research completed successfully', 'Report saved'],
          reportMeta,
          researchPlan,
        });
      } catch (error) {
        console.error('Error saving report:', error);
        throw new Error('Failed to save report');
      }

      await writer.close();
    } catch (error) {
      console.error('Research stream error:', error);
      await sendUpdate({
        error: error instanceof Error ? error.message : 'Research process failed',
        step: 'Error',
        progress: 0,
        logs: ['Error occurred during research: ' + (error instanceof Error ? error.message : 'Unknown error')],
      });
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 