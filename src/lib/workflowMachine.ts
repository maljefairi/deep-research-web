import { createMachine, assign } from "xstate";

// Define types for the research workflow
interface ResearchStep {
  id: string;
  name: string;
  status: 'pending' | 'completed' | 'error';
  description?: string;
}

interface ResearchContext {
  steps: ResearchStep[];
  currentStepId?: string;
  error?: string;
}

type ResearchEvent =
  | { type: 'START' }
  | { type: 'UPDATE_STEPS'; steps: ResearchStep[] }
  | { type: 'COMPLETE_STEP'; stepId: string }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' }
  | { type: 'FINISH' };

// Default research steps with descriptions
const defaultSteps: ResearchStep[] = [
  { 
    id: "setup", 
    name: "Initial Setup", 
    status: "pending",
    description: "Configure research parameters and scope"
  },
  { 
    id: "planning", 
    name: "Research Planning", 
    status: "pending",
    description: "Generate research questions and outline"
  },
  { 
    id: "deep_research", 
    name: "Deep Research", 
    status: "pending",
    description: "Conduct comprehensive analysis and data gathering"
  },
  { 
    id: "reporting", 
    name: "Report Generation", 
    status: "pending",
    description: "Compile findings into structured report"
  },
  { 
    id: "finalization", 
    name: "Finalization", 
    status: "pending",
    description: "Review and finalize research outputs"
  }
];

// Research state machine with proper typing
export const workflowMachine = createMachine<ResearchContext, ResearchEvent>({
  id: "researchWorkflow",
  initial: "idle",
  context: {
    steps: defaultSteps
  },
  states: {
    idle: {
      on: { 
        START: {
          target: "running",
          actions: assign({
            error: undefined,
            currentStepId: (context) => context.steps[0]?.id
          })
        }
      }
    },
    running: {
      on: {
        UPDATE_STEPS: {
          actions: assign({
            steps: (_, event) => event.steps
          })
        },
        COMPLETE_STEP: {
          actions: [
            assign({
              steps: (context, event) =>
                context.steps.map(step =>
                  step.id === event.stepId ? { ...step, status: "completed" } : step
                ),
              currentStepId: (context, event) => {
                const currentIndex = context.steps.findIndex(s => s.id === event.stepId);
                return context.steps[currentIndex + 1]?.id;
              }
            })
          ]
        },
        ERROR: {
          actions: assign({
            error: (_, event) => event.message
          })
        },
        RESET: {
          actions: assign({ 
            steps: defaultSteps,
            error: undefined,
            currentStepId: undefined
          })
        },
        FINISH: {
          target: "completed",
          cond: (context) => context.steps.every(step => step.status === "completed")
        }
      }
    },
    completed: {
      type: "final"
    }
  }
});
