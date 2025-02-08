# Deep Research Web Application

An AI-powered research assistant that helps you conduct comprehensive research on any topic. The application uses advanced AI models and web crawling to gather, analyze, and synthesize information into detailed research reports.

## Features

- 🤖 AI-powered research process
- 🌐 Intelligent web crawling
- 📝 Interactive question-answer based research
- 📊 Real-time progress tracking
- 📑 Markdown and PDF report generation
- 📚 Research history management
- 🌓 Dark mode support
- 📱 Responsive design

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, TailwindCSS
- **AI**: OpenAI gpt-4o-mini, Marked
- **Web Crawling**: Firecrawl
- **PDF Generation**: jsPDF
- **Styling**: Tailwind CSS with Typography plugin

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
   Edit `.env.local` and add your API keys:
   - `NEXT_PUBLIC_FIRECRAWL_KEY`: Your Firecrawl API key
   - `NEXT_PUBLIC_OPENAI_KEY`: Your OpenAI API key
   - `NEXT_PUBLIC_OPENAI_MODEL`: OpenAI model to use (default: gpt-4o-mini)
   - `CONTEXT_SIZE`: Maximum context size for text processing

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Starting Research**:
   - Enter your research topic
   - Adjust research breadth (3-10) and depth (1-5)
   - Click "Start Research"

2. **Answer Questions**:
   - The AI will generate preliminary questions
   - Answer them to help focus the research
   - Submit answers to begin the research process

3. **Research Process**:
   - Watch real-time progress updates
   - View recent discoveries as they happen
   - See sources being analyzed

4. **View Results**:
   - Read the generated research report
   - Download in Markdown or PDF format
   - Access previous reports from the sidebar

## Project Structure

```
deep-research-web/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── research/     # Research API endpoints
│   │   │   └── reports/      # Report management endpoints
│   │   ├── components/       # React components
│   │   └── page.tsx         # Main application page
│   ├── lib/
│   │   ├── deep-research/   # Core research logic
│   │   └── ai/             # AI integration
├── public/                 # Static assets
└── reports/               # Generated research reports
```

## Key Components

- `ResearchForm`: Handles research input and parameters
- `ProgressDisplay`: Shows real-time research progress
- `ResultsView`: Displays research results with Markdown rendering
- `deep-research.ts`: Core research implementation
- `api/research/route.ts`: Research API endpoint
- `api/reports/route.ts`: Report management endpoint

## Development Guidelines

1. **Code Organization**:
   - Keep components focused and single-responsibility
   - Use TypeScript for type safety
   - Follow the existing file structure

2. **Styling**:
   - Use Tailwind CSS classes
   - Follow dark mode conventions
   - Maintain responsive design

3. **Error Handling**:
   - Implement comprehensive error handling
   - Provide user-friendly error messages
   - Log errors appropriately

4. **Performance**:
   - Optimize API calls
   - Implement proper caching
   - Handle large documents efficiently

## API Rate Limits

- Firecrawl: Implement delays between requests
- OpenAI: Handle token limits and context windows
- Add appropriate error handling for rate limits

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
- Firecrawl for web crawling capabilities
- Next.js team for the framework
- TailwindCSS for styling utilities
