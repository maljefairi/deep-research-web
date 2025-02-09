import React, { useState } from "react";
import { useMachine } from "@xstate/react";
import { workflowMachine } from "../lib/workflowMachine";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Komponen untuk setiap langkah
const StepItem = ({ step, index }: any) => {
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
        backgroundColor: step.status === "completed" ? "#D4EDDA" : "#FFF",
        borderRadius: "5px",
        border: "1px solid #DDD",
        cursor: "grab"
      }}
    >
      {index + 1}. {step.name}
    </div>
  );
};

// Komponen utama editor workflow
const WorkflowEditor = () => {
  const [state, send] = useMachine(workflowMachine);
  const [steps, setSteps] = useState(state.context.steps);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = steps.findIndex(step => step.id === active.id);
      const newIndex = steps.findIndex(step => step.id === over.id);
      const newSteps = arrayMove(steps, oldIndex, newIndex);
      setSteps(newSteps);
      send({ type: "UPDATE_STEPS", steps: newSteps });
    }
  };

  return (
    <div>
      <h2>🔄 Sesuaikan Alur Penelitian</h2>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={steps}>
          {steps.map((step, index) => (
            <StepItem key={step.id} step={step} index={index} />
          ))}
        </SortableContext>
      </DndContext>
      <button onClick={() => send({ type: "START" })}>Mulai Penelitian</button>
      <button onClick={() => send({ type: "RESET" })}>Reset</button>
    </div>
  );
};

export default WorkflowEditor;
