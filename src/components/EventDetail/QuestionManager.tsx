import { useState } from 'react';
import { Plus, X, Edit2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface Question {
  id: string;
  question_text: string;
  order_index?: number;
}

interface QuestionManagerProps {
  eventId: string;
  questions: Question[];
  onUpdate: () => void;
}

export function QuestionManager({ eventId, questions, onUpdate }: QuestionManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [editQuestion, setEditQuestion] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) {
      setError('Question text is required');
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('questions')
        .insert({
          event_id: eventId,
          question_text: newQuestion.trim(),
          order_index: questions.length,
        });

      if (insertError) throw insertError;

      setNewQuestion('');
      setIsAdding(false);
      setError(null);
      onUpdate();
    } catch (err: any) {
      console.error('[QuestionManager] Error adding question:', err);
      setError('Failed to add question');
    }
  };

  const handleUpdateQuestion = async (questionId: string) => {
    if (!editQuestion.trim()) {
      setError('Question text is required');
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('questions')
        .update({ question_text: editQuestion.trim() })
        .eq('id', questionId);

      if (updateError) throw updateError;

      setEditingId(null);
      setEditQuestion('');
      setError(null);
      onUpdate();
    } catch (err: any) {
      console.error('[QuestionManager] Error updating question:', err);
      setError('Failed to update question');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (deleteError) throw deleteError;

      setError(null);
      onUpdate();
    } catch (err: any) {
      console.error('[QuestionManager] Error deleting question:', err);
      setError('Failed to delete question');
    }
  };

  const startEdit = (question: Question) => {
    setEditingId(question.id);
    setEditQuestion(question.question_text);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditQuestion('');
    setError(null);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Custom Questions ({questions.length})</h3>
          {!isAdding && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Question
            </Button>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Add new question form */}
        {isAdding && (
          <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-question">Question *</Label>
              <Input
                id="new-question"
                placeholder="e.g., Dietary restrictions?"
                value={newQuestion}
                onChange={(e) => {
                  setNewQuestion(e.target.value);
                  setError(null);
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddQuestion} size="sm" className="gap-2">
                <Check className="h-4 w-4" />
                Add
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setNewQuestion('');
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Question list */}
        <div className="space-y-2">
          {questions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No custom questions yet. Add questions to collect info from guests.
            </p>
          ) : (
            questions.map((question, idx) => (
              <div
                key={question.id}
                className="flex items-start gap-3 border rounded-lg p-3 bg-background"
              >
                <span className="text-sm font-medium text-muted-foreground mt-1">
                  {idx + 1}.
                </span>
                
                {editingId === question.id ? (
                  // Edit mode
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Question text"
                      value={editQuestion}
                      onChange={(e) => {
                        setEditQuestion(e.target.value);
                        setError(null);
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateQuestion(question.id)}
                        className="gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Save
                      </Button>
                      <Button variant="outline" size="sm" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <>
                    <p className="flex-1 font-medium">{question.question_text}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(question)}
                        className="gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
