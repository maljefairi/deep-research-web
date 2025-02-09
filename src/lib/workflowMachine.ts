import { createMachine, assign } from "xstate";

// Definisi langkah-langkah penelitian default
const defaultSteps = [
  { id: "setup", name: "Pengaturan Awal", status: "pending" },
  { id: "planning", name: "Perencanaan", status: "pending" },
  { id: "deep_research", name: "Penelitian Mendalam", status: "pending" },
  { id: "reporting", name: "Pembuatan Laporan", status: "pending" },
  { id: "finalization", name: "Finalisasi", status: "pending" }
];

// Mesin state penelitian
export const workflowMachine = createMachine({
  id: "researchWorkflow",
  initial: "idle",
  context: {
    steps: defaultSteps
  },
  states: {
    idle: {
      on: { START: "running" }
    },
    running: {
      on: {
        UPDATE_STEPS: {
          actions: assign({
            steps: (_, event) => event.steps
          })
        },
        COMPLETE_STEP: {
          actions: assign({
            steps: (context, event) =>
              context.steps.map(step =>
                step.id === event.stepId ? { ...step, status: "completed" } : step
              )
          })
        },
        RESET: {
          actions: assign({ steps: defaultSteps })
        },
        FINISH: "completed"
      }
    },
    completed: {
      type: "final"
    }
  }
});
