import { Plus, Trash2 } from "lucide-react";
import type { EventFormData } from "@/pages/CreateEvent";

interface EventBlocksStepProps {
  formData: EventFormData;
  updateFormData: (updates: Partial<EventFormData>) => void;
}

const EventBlocksStep = ({ formData, updateFormData }: EventBlocksStepProps) => {
  const addBlock = () => {
    updateFormData({
      blocks: [...formData.blocks, { name: "", startTime: "", endTime: "" }],
    });
  };

  const updateBlock = (index: number, updates: Partial<typeof formData.blocks[0]>) => {
    const newBlocks = [...formData.blocks];
    newBlocks[index] = { ...newBlocks[index], ...updates };
    updateFormData({ blocks: newBlocks });
  };

  const removeBlock = (index: number) => {
    updateFormData({
      blocks: formData.blocks.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Time Blocks</h2>
        <p className="text-muted-foreground">
          Break your event into time blocks for better RSVP tracking.
        </p>
      </div>

      <div className="space-y-4">
        {formData.blocks.map((block, index) => (
          <div
            key={index}
            className="p-4 rounded-lg border border-border bg-muted/20 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Block {index + 1}
              </span>
              <button
                onClick={() => removeBlock(index)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={block.name}
              onChange={(e) => updateBlock(index, { name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="e.g., Friday Night Dinner"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="datetime-local"
                value={block.startTime}
                onChange={(e) => updateBlock(index, { startTime: e.target.value })}
                className="px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
              />
              <input
                type="datetime-local"
                value={block.endTime}
                onChange={(e) => updateBlock(index, { endTime: e.target.value })}
                className="px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
              />
            </div>
          </div>
        ))}

        <button
          onClick={addBlock}
          className="w-full py-3 rounded-lg border-2 border-dashed border-border hover:border-primary text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Time Block
        </button>

        {formData.blocks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No blocks yet. Add time blocks to let guests RSVP to specific parts of your event.
          </p>
        )}
      </div>
    </div>
  );
};

export default EventBlocksStep;
