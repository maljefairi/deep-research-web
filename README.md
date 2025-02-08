# Deep Research Web Application

A web-based interface for conducting deep research using AI-powered tools and web crawling capabilities.

## Project Structure

```
deep-research-web/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── research/
│   │   │       └── route.ts       # API endpoint for research operations
│   │   ├── components/
│   │   │   ├── ExistingReports.tsx   # Component for displaying existing reports
│   │   │   ├── ProgressDisplay.tsx    # Component for showing research progress
│   │   │   └── ResearchForm.tsx       # Form component for research input
│   │   └── page.tsx               # Main application page
│   ├── lib/
│   │   ├── deep-research/
│   │   │   ├── index.ts           # Core research implementation
│   │   │   ├── prompts.ts         # AI system prompts
│   │   │   └── providers.ts       # AI provider configurations
│   │   └── utils/                 # Utility functions
└── reports/                       # Directory for storing research reports
```

## Core Components

### Research Implementation (`/lib/deep-research/index.ts`)
- Implements the core research logic using AI and web crawling
- Manages research depth and breadth
- Handles progress tracking and error reporting

### AI Integration (`/lib/deep-research/providers.ts`)
- Configures OpenAI integration
- Manages API keys and model settings
- Implements token management and prompt optimization

### System Prompts (`/lib/deep-research/prompts.ts`)
- Defines AI system behavior and instructions
- Contains templates for research queries and analysis

### API Route (`/api/research/route.ts`)
- Handles research requests and report management
- Implements file system operations for report storage
- Provides progress updates and error handling

## Frontend Components

### Main Page (`/app/page.tsx`)
- Orchestrates the research interface
- Manages application state and error handling
- Coordinates between form input and research display

### Research Form (`/components/ResearchForm.tsx`)
- Handles user input for research parameters
- Validates input and manages form state
- Triggers research process

### Progress Display (`/components/ProgressDisplay.tsx`)
- Shows real-time research progress
- Displays error messages and status updates
- Provides visual feedback during research

### Existing Reports (`/components/ExistingReports.tsx`)
- Lists previously generated research reports
- Manages report viewing and navigation
- Displays report metadata

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```
   OPENAI_API_KEY=your_api_key
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development Guidelines

1. **Error Handling**
   - Implement comprehensive error handling at all levels
   - Provide clear error messages to users
   - Log errors appropriately for debugging

2. **Progress Tracking**
   - Use the progress callback system for real-time updates
   - Ensure accurate progress reporting
   - Handle edge cases and failures gracefully

3. **Code Organization**
   - Keep components focused and single-responsibility
   - Use TypeScript for type safety
   - Document complex logic and important functions

4. **Performance**
   - Implement proper token management for AI calls
   - Optimize web crawling operations
   - Use appropriate caching strategies

## Future Improvements

1. Add support for multiple AI providers
2. Implement advanced research customization options
3. Add report export functionality
4. Enhance error recovery mechanisms
5. Implement user authentication and report sharing

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
