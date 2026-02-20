import { useState } from 'react';
import { Plus, X, Edit2, Check, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface Block {
  id: string;
  name: string;
  start_time: string | null;
  end_time: string | null;
  order_index?: number;
}

interface BlockManagerProps {
  eventId: string;
  blocks: Block[];
  onUpdate: () => void;
}

export function BlockManager({ eventId, blocks, onUpdate }: BlockManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newBlockName, setNewBlockName] = useState('');
  const [editBlockName, setEditBlockName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddBlock = async () => {
    if (!newBlockName.trim()) {
      setError('Block name is required');
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('blocks')
        .insert({
          event_id: eventId,
          name: newBlockName.trim(),
          order_index: blocks.length,
        });

      if (insertError) throw insertError;

      setNewBlockName('');
      setIsAdding(false);
      setError(null);
      onUpdate();
    } catch (err: any) {
      console.error('[BlockManager] Error adding block:', err);
      setError('Failed to add block');
    }
  };

  const handleUpdateBlock = async (blockId: string) => {
    if (!editBlockName.trim()) {
      setError('Block name is required');
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('blocks')
        .update({ name: editBlockName.trim() })
        .eq('id', blockId);

      if (updateError) throw updateError;

      setEditingId(null);
      setEditBlockName('');
      setError(null);
      onUpdate();
    } catch (err: any) {
      console.error('[BlockManager] Error updating block:', err);
      setError('Failed to update block');
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('blocks')
        .delete()
        .eq('id', blockId);

      if (deleteError) throw deleteError;

      setError(null);
      onUpdate();
    } catch (err: any) {
      console.error('[BlockManager] Error deleting block:', err);
      setError('Failed to delete block');
    }
  };

  const startEdit = (block: Block) => {
    setEditingId(block.id);
    setEditBlockName(block.name);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditBlockName('');
    setError(null);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Time Blocks ({blocks.length})</h3>
          {!isAdding && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Block
            </Button>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Add new block form */}
        {isAdding && (
          <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-block-name">Block Name *</Label>
              <Input
                id="new-block-name"
                placeholder="e.g., Cocktails, Dinner, Dancing"
                value={newBlockName}
                onChange={(e) => {
                  setNewBlockName(e.target.value);
                  setError(null);
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddBlock} size="sm" className="gap-2">
                <Check className="h-4 w-4" />
                Add
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setNewBlockName('');
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Block list */}
        <div className="space-y-2">
          {blocks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No time blocks yet. Add activities like "Dinner" or "Dancing" to help guests RSVP.
            </p>
          ) : (
            blocks.map((block) => (
              <div
                key={block.id}
                className="flex items-center gap-3 border rounded-lg p-3 bg-background"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                
                {editingId === block.id ? (
                  // Edit mode
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      placeholder="Block name"
                      value={editBlockName}
                      onChange={(e) => {
                        setEditBlockName(e.target.value);
                        setError(null);
                      }}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleUpdateBlock(block.id)}
                      className="gap-2"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  // View mode
                  <>
                    <div className="flex-1">
                      <p className="font-medium">{block.name}</p>
                      {block.start_time && block.end_time && (
                        <p className="text-sm text-muted-foreground">
                          {new Date(block.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(block.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(block)}
                        className="gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBlock(block.id)}
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
