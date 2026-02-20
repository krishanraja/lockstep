import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  X as XIcon,
  ToggleLeft,
  List,
  CheckSquare,
  Type,
  Hash,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Question {
  id: string;
  prompt: string;
  type: string;
  options: string[] | null;
  required: boolean | null;
  order_index?: number;
}

interface QuestionManagerProps {
  eventId: string;
  questions: Question[];
  onUpdate: () => void;
}

type QuestionType = 'boolean' | 'single_select' | 'multi_select' | 'text' | 'number';

interface QuestionDraft {
  prompt: string;
  type: QuestionType;
  options: string[];
  required: boolean;
}

const EMPTY_DRAFT: QuestionDraft = { prompt: '', type: 'boolean', options: [''], required: false };

const TYPE_OPTIONS: { value: QuestionType; label: string; icon: typeof ToggleLeft }[] = [
  { value: 'boolean', label: 'Yes / No', icon: ToggleLeft },
  { value: 'single_select', label: 'Single Choice', icon: List },
  { value: 'multi_select', label: 'Multi Choice', icon: CheckSquare },
  { value: 'text', label: 'Free Text', icon: Type },
  { value: 'number', label: 'Number', icon: Hash },
];

const needsOptions = (type: QuestionType) => type === 'single_select' || type === 'multi_select';

export const QuestionManager = ({ eventId, questions, onUpdate }: QuestionManagerProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<QuestionDraft>(EMPTY_DRAFT);
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    if (!draft.prompt.trim()) return;
    setIsSaving(true);
    try {
      const cleanOptions = needsOptions(draft.type)
        ? draft.options.map(o => o.trim()).filter(Boolean)
        : null;

      const { error } = await supabase.from('questions').insert({
        event_id: eventId,
        prompt: draft.prompt.trim(),
        type: draft.type,
        options: cleanOptions,
        required: draft.required,
        order_index: questions.length,
      });
      if (error) throw error;
      setDraft(EMPTY_DRAFT);
      setIsAdding(false);
      onUpdate();
    } catch (err) {
      console.error('Error adding question:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async (questionId: string) => {
    const { data } = await supabase
      .from('questions')
      .select('prompt, type, options, required')
      .eq('id', questionId)
      .single();

    if (data) {
      setEditingId(questionId);
      setDraft({
        prompt: data.prompt,
        type: data.type as QuestionType,
        options: Array.isArray(data.options) ? (data.options as string[]) : [''],
        required: data.required ?? false,
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !draft.prompt.trim()) return;
    setIsSaving(true);
    try {
      const cleanOptions = needsOptions(draft.type)
        ? draft.options.map(o => o.trim()).filter(Boolean)
        : null;

      const { error } = await supabase
        .from('questions')
        .update({
          prompt: draft.prompt.trim(),
          type: draft.type,
          options: cleanOptions,
          required: draft.required,
        })
        .eq('id', editingId);
      if (error) throw error;
      setEditingId(null);
      setDraft(EMPTY_DRAFT);
      onUpdate();
    } catch (err) {
      console.error('Error updating question:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    try {
      const { error } = await supabase.from('questions').delete().eq('id', questionId);
      if (error) throw error;
      onUpdate();
    } catch (err) {
      console.error('Error deleting question:', err);
    }
  };

  const handleReorder = async (questionId: string, direction: 'up' | 'down') => {
    const idx = questions.findIndex(q => q.id === questionId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= questions.length) return;

    try {
      await Promise.all([
        supabase.from('questions').update({ order_index: swapIdx }).eq('id', questions[idx].id),
        supabase.from('questions').update({ order_index: idx }).eq('id', questions[swapIdx].id),
      ]);
      onUpdate();
    } catch (err) {
      console.error('Error reordering questions:', err);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  };

  const addOption = () => setDraft(d => ({ ...d, options: [...d.options, ''] }));
  const removeOption = (i: number) =>
    setDraft(d => ({ ...d, options: d.options.filter((_, idx) => idx !== i) }));
  const setOption = (i: number, val: string) =>
    setDraft(d => ({ ...d, options: d.options.map((o, idx) => (idx === i ? val : o)) }));

  const renderForm = (onSave: () => void) => (
    <div className="space-y-3 p-4 rounded-xl bg-card border border-border/50">
      <input
        type="text"
        placeholder="Question *"
        value={draft.prompt}
        onChange={e => setDraft(d => ({ ...d, prompt: e.target.value }))}
        className="w-full px-3 py-2 rounded-lg bg-muted border border-border/50 text-foreground
          text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        autoFocus
      />

      {/* Type selector */}
      <div className="flex flex-wrap gap-1.5">
        {TYPE_OPTIONS.map(opt => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => setDraft(d => ({ ...d, type: opt.value }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${draft.type === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Options editor */}
      {needsOptions(draft.type) && (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Options</label>
          {draft.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={e => setOption(i, e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-muted border border-border/50 text-foreground
                  text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {draft.options.length > 1 && (
                <button onClick={() => removeOption(i)}
                  className="p-1 rounded hover:bg-destructive/10 transition-colors">
                  <XIcon className="w-3.5 h-3.5 text-destructive" />
                </button>
              )}
            </div>
          ))}
          <button onClick={addOption}
            className="text-xs text-primary hover:underline flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add option
          </button>
        </div>
      )}

      {/* Required toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={draft.required}
          onChange={e => setDraft(d => ({ ...d, required: e.target.checked }))}
          className="rounded border-border text-primary focus:ring-primary"
        />
        <span className="text-xs text-muted-foreground">Required</span>
      </label>

      <div className="flex items-center justify-end gap-2">
        <button onClick={handleCancel}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
          Cancel
        </button>
        <button onClick={onSave} disabled={!draft.prompt.trim() || isSaving}
          className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium
            flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
          <Check className="w-3.5 h-3.5" />
          {isSaving ? 'Saving...' : editingId ? 'Save' : 'Add Question'}
        </button>
      </div>
    </div>
  );

  const getTypeIcon = (type: string) => {
    const opt = TYPE_OPTIONS.find(o => o.value === type);
    if (opt) {
      const Icon = opt.icon;
      return <Icon className="w-4 h-4 text-primary" />;
    }
    return <HelpCircle className="w-4 h-4 text-primary" />;
  };

  const getTypeLabel = (type: string) => TYPE_OPTIONS.find(o => o.value === type)?.label || type;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <HelpCircle className="w-4 h-4 text-primary" />
          Custom Questions ({questions.length})
        </div>
        {!isAdding && !editingId && (
          <button onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium
              flex items-center gap-1.5 hover:opacity-90 transition-opacity">
            <Plus className="w-3.5 h-3.5" />
            Add Question
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            {renderForm(handleAdd)}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {questions.length === 0 && !isAdding && (
          <div className="p-6 text-center text-muted-foreground rounded-xl bg-card border border-border/50">
            <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No custom questions yet. Add questions to collect specific info from guests.</p>
          </div>
        )}

        {questions.map((question, index) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
          >
            {editingId === question.id ? (
              renderForm(handleSaveEdit)
            ) : (
              <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50
                hover:border-primary/20 transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {getTypeIcon(question.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">
                      {question.prompt}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getTypeLabel(question.type)}{question.required ? ' · Required' : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => handleReorder(question.id, 'up')} disabled={index === 0}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-30" title="Move up">
                    <ArrowUp className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleReorder(question.id, 'down')} disabled={index === questions.length - 1}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-30" title="Move down">
                    <ArrowDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleEdit(question.id)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Edit">
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(question.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="Delete">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default QuestionManager;
