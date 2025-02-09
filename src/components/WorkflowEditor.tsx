import React, { useState } from "react";
import { useMachine } from "@xstate/react";
import { workflowMachine } from "../lib/workflowMachine";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Define types
interface ResearchStep {
  id: string;
  name: string;
  status: 'pending' | 'completed' | 'error';
  description?: string;
}

interface StepItemProps {
  step: ResearchStep;
  index: number;
}

// Step component with proper types and accessibility
const StepItem = ({ step, index }: StepItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: step.id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        padding: "10px",
        margin: "5px",
        backgroundColor: step.status === "completed" ? "#D4EDDA" : 
                       step.status === "error" ? "#F8D7DA" : "#FFF",
        borderRadius: "5px",
        border: "1px solid #DDD",
        cursor: "grab"
      }}
      role="listitem"
      aria-label={`Research step ${index + 1}: ${step.name}`}
    >
      <div className="flex items-center justify-between">
        <span>{index + 1}. {step.name}</span>
        {step.status === 'completed' && (
          <span role="img" aria-label="Completed" className="ml-2">✅</span>
        )}
      </div>
      {step.description && (
        <p className="text-sm text-gray-600 mt-1">{step.description}</p>
      )}
    </div>
  );
};

// Main workflow editor component with error handling
const WorkflowEditor = () => {
  const [state, send] = useMachine(workflowMachine);
  const [steps, setSteps] = useState<ResearchStep[]>(state.context.steps);
  const [error, setError] = useState<string | null>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    try {
      const { active, over } = event;
      if (active.id !== over?.id) {
        const oldIndex = steps.findIndex(step => step.id === active.id);
        const newIndex = steps.findIndex(step => step.id === over?.id);
        
        if (oldIndex === -1 || newIndex === -1) {
          throw new Error('Invalid step indices');
        }

        const newSteps = arrayMove(steps, oldIndex, newIndex);
        setSteps(newSteps);
        send({ type: "UPDATE_STEPS", steps: newSteps });
        setError(null);
      }
    } catch (err) {
      console.error('Error reordering steps:', err);
      setError('Failed to reorder steps. Please try again.');
    }
  };

  const handleStart = () => {
    try {
      send({ type: "START" });
      setError(null);
    } catch (err) {
      console.error('Error starting research:', err);
      setError('Failed to start research. Please try again.');
    }
  };

  const handleReset = () => {
    try {
      send({ type: "RESET" });
      setSteps(state.context.steps);
      setError(null);
    } catch (err) {
      console.error('Error resetting workflow:', err);
      setError('Failed to reset workflow. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">🔄 Customize Research Flow</h2>
      
      {error && (
        <div role="alert" className="bg-red-100 text-red-700 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={steps}>
            <div role="list" aria-label="Research steps" className="space-y-2">
              {steps.map((step, index) => (
                <StepItem key={step.id} step={step} index={index} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleStart}
          disabled={state.matches('running')}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {state.matches('running') ? 'Research in Progress...' : 'Start Research'}
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default WorkflowEditor;
