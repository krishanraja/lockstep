import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Trash2, Plus, Check, GripVertical, Library, ChevronDown } from 'lucide-react';
import type { QuestionTemplate } from '@/data/templates/types';
import { QUESTION_LIBRARY, CHECKPOINT_PRESETS, OPTION_PRESETS, type LibraryQuestion, toQuestionTemplate } from '@/data/question-library';

interface EditableQuestion extends QuestionTemplate {
  id: string;
}

interface EditQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuestionTemplate[];
  onSave: (questions: QuestionTemplate[]) => void;
  eventType?: string; // To filter relevant questions
}

// Only structured question types allowed - NO free text for data quality
const questionTypeLabels: Record<string, string> = {
  boolean: 'Yes/No',
  single_select: 'Single Choice',
  multi_select: 'Multiple Choice',
  number: 'Number',
  // 'text' type removed - open-ended text defeats AI data processing
};

export function EditQuestionsModal({
  isOpen,
  onClose,
  questions,
  onSave,
  eventType = 'custom',
}: EditQuestionsModalProps) {
  const [editableQuestions, setEditableQuestions] = useState<EditableQuestion[]>(() =>
    questions.map((q, index) => ({
      ...q,
      id: `q-${index}-${Date.now()}`,
    }))
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editType, setEditType] = useState<QuestionTemplate['type']>('boolean');
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Get questions from library that aren't already added
  const availableLibraryQuestions = QUESTION_LIBRARY.filter(lq => 
    (lq.applicableEventTypes.includes(eventType) || lq.applicableEventTypes.includes('custom')) &&
    !editableQuestions.some(eq => eq.prompt === lq.prompt)
  );

  const handleStartEdit = (question: EditableQuestion) => {
    setEditingId(question.id);
    setEditPrompt(question.prompt);
    setEditType(question.type);
    setEditOptions(question.options || []);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editPrompt.trim()) return;
    
    setEditableQuestions(prev =>
      prev.map(q =>
        q.id === editingId
          ? { 
              ...q, 
              prompt: editPrompt.trim(), 
              type: editType,
              options: ['single_select', 'multi_select'].includes(editType) ? editOptions.filter(o => o.trim()) : undefined,
            }
          : q
      )
    );
    setEditingId(null);
    setEditPrompt('');
    setEditType('text');
    setEditOptions([]);
  };

  const handleDelete = (id: string) => {
    setEditableQuestions(prev => prev.filter(q => q.id !== id));
  };

  // Add question from library (no free text allowed)
  const handleAddFromLibrary = (libraryQuestion: LibraryQuestion) => {
    const newQuestion: EditableQuestion = {
      id: `q-${libraryQuestion.id}-${Date.now()}`,
      ...toQuestionTemplate(libraryQuestion),
    };
    setEditableQuestions(prev => [...prev, newQuestion]);
    setShowLibrary(false);
  };

  // Handle selecting a preset for options
  const handleSelectPreset = (presetKey: string) => {
    const options = OPTION_PRESETS[presetKey];
    if (options) {
      setEditOptions([...options]);
      setSelectedPreset(presetKey);
    }
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = editableQuestions.findIndex(q => q.id === draggedId);
    const targetIndex = editableQuestions.findIndex(q => q.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newQuestions = [...editableQuestions];
    const [draggedQuestion] = newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(targetIndex, 0, draggedQuestion);
    setEditableQuestions(newQuestions);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleAddOption = () => {
    setEditOptions(prev => [...prev, '']);
  };

  const handleUpdateOption = (index: number, value: string) => {
    setEditOptions(prev => prev.map((opt, i) => i === index ? value : opt));
  };

  const handleRemoveOption = (index: number) => {
    setEditOptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = () => {
    const savedQuestions: QuestionTemplate[] = editableQuestions.map(({ id, ...q }) => q);
    onSave(savedQuestions);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-lg bg-background rounded-t-3xl max-h-[85vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Edit Questions</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Question List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {editableQuestions.map((question) => (
              <motion.div
                key={question.id}
                layout
                draggable={editingId !== question.id}
                onDragStart={() => handleDragStart(question.id)}
                onDragOver={(e) => handleDragOver(e, question.id)}
                onDragEnd={handleDragEnd}
                className={`p-3 rounded-xl bg-card border border-border/50
                  ${draggedId === question.id ? 'opacity-50' : ''}
                  ${editingId === question.id ? 'ring-2 ring-primary' : ''}
                `}
              >
                {editingId === question.id ? (
                  <div className="space-y-3">
                    {/* Question prompt - now a dropdown of predefined prompts */}
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Question</label>
                      <select
                        value={editPrompt}
                        onChange={(e) => {
                          setEditPrompt(e.target.value);
                          // Auto-set type and options if selecting from library
                          const libQuestion = QUESTION_LIBRARY.find(q => q.prompt === e.target.value);
                          if (libQuestion) {
                            setEditType(libQuestion.type);
                            setEditOptions(libQuestion.options || []);
                          }
                        }}
                        className="w-full bg-muted px-3 py-2 rounded-lg text-foreground outline-none
                          focus:ring-2 focus:ring-primary"
                      >
                        <option value={editPrompt}>{editPrompt}</option>
                        {QUESTION_LIBRARY.filter(q => q.prompt !== editPrompt).map(q => (
                          <option key={q.id} value={q.prompt}>{q.prompt}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Question type - no text option */}
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Answer Type</label>
                      <select
                        value={editType}
                        onChange={(e) => setEditType(e.target.value as QuestionTemplate['type'])}
                        className="w-full bg-muted px-3 py-2 rounded-lg text-foreground outline-none
                          focus:ring-2 focus:ring-primary"
                      >
                        <option value="boolean">Yes/No</option>
                        <option value="single_select">Single Choice</option>
                        <option value="multi_select">Multiple Choice</option>
                        <option value="number">Number</option>
                      </select>
                    </div>

                    {/* Options for select types - with preset picker */}
                    {['single_select', 'multi_select'].includes(editType) && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">Options:</p>
                          <select
                            value={selectedPreset || ''}
                            onChange={(e) => handleSelectPreset(e.target.value)}
                            className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground"
                          >
                            <option value="">Use preset...</option>
                            <option value="dietary">Dietary</option>
                            <option value="budget">Budget</option>
                            <option value="transport">Transport</option>
                            <option value="accommodation">Accommodation</option>
                            <option value="days">Days</option>
                            <option value="attendance">Attendance</option>
                            <option value="yesnomaybe">Yes/No/Maybe</option>
                          </select>
                        </div>
                        {editOptions.map((option, index) => (
                          <div key={index} className="flex gap-2">
                            <select
                              value={option}
                              onChange={(e) => handleUpdateOption(index, e.target.value)}
                              className="flex-1 bg-muted px-3 py-2 rounded-lg text-foreground text-sm
                                outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value={option}>{option || `Option ${index + 1}`}</option>
                              {/* Show common options that aren't already selected */}
                              {Object.values(OPTION_PRESETS).flat()
                                .filter((o, i, arr) => arr.indexOf(o) === i && !editOptions.includes(o))
                                .map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                            <button
                              onClick={() => handleRemoveOption(index)}
                              className="p-2 text-muted-foreground hover:text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={handleAddOption}
                          className="text-xs text-primary hover:text-primary/80"
                        >
                          + Add option
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditPrompt('');
                          setEditType('text');
                          setEditOptions([]);
                        }}
                        className="flex-1 py-2 rounded-lg bg-muted text-muted-foreground text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm
                          flex items-center justify-center gap-1"
                      >
                        <Check className="w-4 h-4" />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="cursor-grab active:cursor-grabbing text-muted-foreground">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-confirmed/10 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-confirmed" />
                    </div>
                    <button
                      onClick={() => handleStartEdit(question)}
                      className="flex-1 text-left"
                    >
                      <p className="text-foreground font-medium text-sm">{question.prompt}</p>
                      <p className="text-xs text-muted-foreground">
                        {questionTypeLabels[question.type] || question.type}
                        {question.options && question.options.length > 0 && 
                          ` • ${question.options.length} options`
                        }
                      </p>
                    </button>
                    <button
                      onClick={() => handleDelete(question.id)}
                      className="p-1.5 rounded-full text-muted-foreground hover:text-destructive 
                        hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}

            {/* Add Question from Library */}
            {!showLibrary ? (
              <button
                onClick={() => setShowLibrary(true)}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl
                  border-2 border-dashed border-border/50 text-muted-foreground
                  hover:border-primary hover:text-primary transition-colors"
              >
                <Library className="w-4 h-4" />
                Add Question from Library
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Select a question:</p>
                  <button
                    onClick={() => setShowLibrary(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {availableLibraryQuestions.length > 0 ? (
                    availableLibraryQuestions.map(lq => (
                      <button
                        key={lq.id}
                        onClick={() => handleAddFromLibrary(lq)}
                        className="w-full text-left p-2 rounded-lg bg-muted/50 hover:bg-muted
                          transition-colors group"
                      >
                        <p className="text-sm text-foreground group-hover:text-primary">
                          {lq.prompt}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {questionTypeLabels[lq.type] || lq.type}
                          {lq.options && ` • ${lq.options.length} options`}
                        </p>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      All available questions have been added
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground font-medium
                hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium
                hover:opacity-90 transition-opacity"
            >
              Save Changes
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}





