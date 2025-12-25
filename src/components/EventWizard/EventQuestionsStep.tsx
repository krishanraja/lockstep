import { Plus, Trash2 } from "lucide-react";
import type { EventFormData } from "@/pages/CreateEvent";

interface EventQuestionsStepProps {
  formData: EventFormData;
  updateFormData: (updates: Partial<EventFormData>) => void;
}

const questionTypes = [
  { value: "boolean", label: "Yes/No" },
  { value: "text", label: "Text Answer" },
  { value: "multi_select", label: "Multiple Choice" },
];

const EventQuestionsStep = ({ formData, updateFormData }: EventQuestionsStepProps) => {
  const addQuestion = () => {
    updateFormData({
      questions: [...formData.questions, { type: "boolean", prompt: "", options: [] }],
    });
  };

  const updateQuestion = (index: number, updates: Partial<typeof formData.questions[0]>) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    updateFormData({ questions: newQuestions });
  };

  const removeQuestion = (index: number) => {
    updateFormData({
      questions: formData.questions.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Custom Questions</h2>
        <p className="text-muted-foreground">
          Add questions to gather more info from your guests (optional).
        </p>
      </div>

      <div className="space-y-4">
        {formData.questions.map((question, index) => (
          <div
            key={index}
            className="p-4 rounded-lg border border-border bg-muted/20 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Question {index + 1}
              </span>
              <button
                onClick={() => removeQuestion(index)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <select
              value={question.type}
              onChange={(e) => updateQuestion(index, { type: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              {questionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={question.prompt}
              onChange={(e) => updateQuestion(index, { prompt: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="e.g., Do you have any dietary requirements?"
            />

            {question.type === "multi_select" && (
              <input
                type="text"
                value={question.options?.join(", ") || ""}
                onChange={(e) =>
                  updateQuestion(index, {
                    options: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                placeholder="Options (comma-separated): Vegetarian, Vegan, Gluten-free"
              />
            )}
          </div>
        ))}

        <button
          onClick={addQuestion}
          className="w-full py-3 rounded-lg border-2 border-dashed border-border hover:border-primary text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </button>

        {formData.questions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No questions yet. Add questions to collect extra info from guests.
          </p>
        )}
      </div>
    </div>
  );
};

export default EventQuestionsStep;
