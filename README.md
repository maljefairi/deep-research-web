# Deep Research Web Application

An AI-powered research assistant that helps you conduct comprehensive research on any topic. The application uses advanced AI models and web crawling to gather, analyze, and synthesize information into detailed research reports.

## Features

- 🤖 AI-powered research process with structured planning
- 🌐 Intelligent web crawling and source analysis
- 📝 Interactive question-answer based research
- 📊 Real-time progress tracking with detailed logs
- 📑 Markdown report generation with automatic TOC
- 📚 Research history management in dedicated storage
- 🌓 Dark mode support
- 📱 Responsive design

## Tech Stack

- **Frontend**: Next.js 14+, React, TypeScript, TailwindCSS
- **AI**: OpenAI gpt-4o-mini, Marked
- **Web Crawling**: Firecrawl
- **PDF Generation**: jsPDF
- **Styling**: Tailwind CSS with Typography plugin

## Project Structure

```
deep-research-web/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── research/
│   │   │   │   ├── stream/     # Research streaming endpoint
│   │   │   │   └── questions/  # Research questions endpoint
│   │   │   └── reports/        # Report management endpoints
│   │   ├── components/         # React components
│   │   └── pages/             # Application pages
│   ├── lib/
│   │   ├── deep-research/     # Core research logic
│   │   └── ai/               # AI integration
├── public/                   # Static assets
└── final_reports/           # Generated research reports
```

## Key Components

### API Endpoints

1. Research Flow:
   - `POST /api/research/questions`: Generates initial research questions
   - `GET /api/research/stream`: Handles real-time research updates with SSE
   
2. Report Management:
   - `GET /api/reports`: Lists all research reports with metadata
   - `GET /api/reports/[id]`: Retrieves specific report content by ID
   - `DELETE /api/reports/[id]`: Deletes a specific report by ID

API Route Parameters:
- `[id]`: Unique identifier for each report (UUID format)

Example API Usage:
```typescript
// List all reports
const reports = await fetch('/api/reports').then(r => r.json());

// Get specific report
const report = await fetch(`/api/reports/${reportId}`).then(r => r.json());

// Delete report
await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
```

### Frontend Components

1. Research Process:
   - `ResearchForm.tsx`: Initial research parameters
   - `ResearchQuestions.tsx`: Question verification
   - `ProgressDisplay.tsx`: Real-time progress tracking
   
2. Results Display:
   - `ResultsView.tsx`: Markdown rendering
   - `ExistingReports.tsx`: Report history sidebar

## Research Process Flow

1. **Initial Setup** (5%):
   - Validate input parameters
   - Initialize research session

2. **Research Planning** (10-15%):
   - Generate research plan
   - Create table of contents
   - Define research sections

3. **Deep Research** (15-90%):
   - Execute section-based research
   - Process search results
   - Gather learnings
   - Track visited sources

4. **Report Generation** (90-95%):
   - Compile findings
   - Generate structured report
   - Format with markdown

5. **Finalization** (95-100%):
   - Save report to final_reports
   - Update report metadata
   - Send completion notification

## Report Storage Structure

Reports are stored in the `final_reports` directory with the following structure:

```
final_reports/
├── [uuid].md         # Report content files
└── .gitkeep         # Ensures directory exists in git
```

Each report file contains:
1. Title (H1 header)
2. Summary (First paragraph)
3. Table of Contents
4. Research Sections
5. Sources List

## API Response Formats

1. Report Listing:
```typescript
interface ReportListing {
  id: string;
  title: string;
  summary: string;
  date: string;
  path: string;
}
```

2. Report Content:
```typescript
interface ReportContent {
  id: string;
  title: string;
  summary: string;
  content: string;
  date: string;
}
```

## Getting Started

### Prerequisites

- Node.js 16.x or later
- npm or yarn
- OpenAI API key
- Firecrawl API key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd deep-research-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Required variables:
   - `NEXT_PUBLIC_FIRECRAWL_KEY`: Your Firecrawl API key
   - `NEXT_PUBLIC_OPENAI_KEY`: Your OpenAI API key
   - `NEXT_PUBLIC_OPENAI_MODEL`: OpenAI model (default: gpt-4o-mini)
   - `CONTEXT_SIZE`: Maximum context size (default: 128000)

4. Create required directories:
   ```bash
   mkdir -p final_reports
   chmod 755 final_reports
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Development Guidelines

1. **Code Organization**:
   - Follow the established directory structure
   - Keep components focused and single-responsibility
   - Use TypeScript for type safety

2. **Research Process**:
   - Implement proper error handling
   - Add progress tracking
   - Save intermediate results
   - Handle rate limits

3. **Report Management**:
   - Use unique IDs for reports
   - Include metadata in reports
   - Implement proper file permissions
   - Handle file operations safely

4. **Performance Considerations**:
   - Implement request throttling
   - Handle large documents efficiently
   - Use proper caching strategies
   - Monitor API rate limits

## Error Handling

1. Research Process:
   - Invalid input parameters
   - Rate limiting
   - API failures
   - Timeout handling

2. File Operations:
   - Directory access
   - File permissions
   - Storage limits
   - Concurrent access

## Security Considerations

1. File System:
   - Proper directory permissions (0o755)
   - Sanitized file paths
   - Protected report access

2. API Endpoints:
   - Input validation
   - Rate limiting
   - Error handling
   - Secure headers

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for GPT models
- Firecrawl for web crawling
- Next.js team
- TailwindCSS team
