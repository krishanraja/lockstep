import { useState } from "react";
import { Plus, Trash2, Library } from "lucide-react";
import type { EventFormData } from "@/pages/CreateEvent";
import { QUESTION_LIBRARY, OPTION_PRESETS, toQuestionTemplate, type LibraryQuestion } from "@/data/question-library";

interface EventQuestionsStepProps {
  formData: EventFormData;
  updateFormData: (updates: Partial<EventFormData>) => void;
}

// Only structured types allowed - no free text for data quality
const questionTypes = [
  { value: "boolean", label: "Yes/No" },
  { value: "single_select", label: "Single Choice" },
  { value: "multi_select", label: "Multiple Choice" },
  { value: "number", label: "Number" },
];

const EventQuestionsStep = ({ formData, updateFormData }: EventQuestionsStepProps) => {
  const [showLibrary, setShowLibrary] = useState(false);

  // Get questions from library that aren't already added
  const availableQuestions = QUESTION_LIBRARY.filter(lq => 
    !formData.questions.some(q => q.prompt === lq.prompt)
  );

  const addQuestionFromLibrary = (libraryQuestion: LibraryQuestion) => {
    updateFormData({
      questions: [...formData.questions, toQuestionTemplate(libraryQuestion)],
    });
    setShowLibrary(false);
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

            {/* Question prompt - select from library */}
            <select
              value={question.prompt}
              onChange={(e) => {
                const newPrompt = e.target.value;
                // Auto-set type and options if selecting from library
                const libQ = QUESTION_LIBRARY.find(q => q.prompt === newPrompt);
                if (libQ) {
                  updateQuestion(index, { 
                    prompt: newPrompt, 
                    type: libQ.type,
                    options: libQ.options || []
                  });
                } else {
                  updateQuestion(index, { prompt: newPrompt });
                }
              }}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              <option value={question.prompt}>{question.prompt || "Select a question..."}</option>
              {QUESTION_LIBRARY.filter(q => q.prompt !== question.prompt).map((q) => (
                <option key={q.id} value={q.prompt}>
                  {q.prompt}
                </option>
              ))}
            </select>

            {/* Question type - no text option */}
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

            {/* Options for select types - use presets */}
            {(question.type === "multi_select" || question.type === "single_select") && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <select
                    onChange={(e) => {
                      const preset = OPTION_PRESETS[e.target.value];
                      if (preset) {
                        updateQuestion(index, { options: [...preset] });
                      }
                    }}
                    className="flex-1 px-3 py-1 rounded-lg border border-border bg-background text-sm"
                    defaultValue=""
                  >
                    <option value="">Apply preset options...</option>
                    <option value="dietary">Dietary</option>
                    <option value="budget">Budget</option>
                    <option value="transport">Transport</option>
                    <option value="accommodation">Accommodation</option>
                    <option value="attendance">Attendance</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(question.options || []).map((opt, optIdx) => (
                    <span key={optIdx} className="px-2 py-1 bg-muted rounded text-xs">
                      {opt}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add Question from Library */}
        {!showLibrary ? (
          <button
            onClick={() => setShowLibrary(true)}
            className="w-full py-3 rounded-lg border-2 border-dashed border-border hover:border-primary text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
          >
            <Library className="w-4 h-4" />
            Add Question from Library
          </button>
        ) : (
          <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Select a question:</span>
              <button
                onClick={() => setShowLibrary(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {availableQuestions.length > 0 ? (
                availableQuestions.map(q => (
                  <button
                    key={q.id}
                    onClick={() => addQuestionFromLibrary(q)}
                    className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <p className="text-sm font-medium">{q.prompt}</p>
                    <p className="text-xs text-muted-foreground">
                      {questionTypes.find(t => t.value === q.type)?.label || q.type}
                      {q.options && ` • ${q.options.length} options`}
                    </p>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All available questions have been added
                </p>
              )}
            </div>
          </div>
        )}

        {formData.questions.length === 0 && !showLibrary && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No questions yet. Add questions from the library to collect info from guests.
          </p>
        )}
      </div>
    </div>
  );
};

export default EventQuestionsStep;
