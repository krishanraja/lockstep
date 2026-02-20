import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  Clock,
  ArrowUp,
  ArrowDown,
  Calendar,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface Block {
  id: string;
  name: string;
  start_time: string | null;
  end_time: string | null;
}

interface BlockManagerProps {
  eventId: string;
  blocks: Block[];
  onUpdate: () => void;
}

interface BlockDraft {
  name: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

const EMPTY_DRAFT: BlockDraft = { name: '', startDate: '', startTime: '', endDate: '', endTime: '' };

function toLocalInputs(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: '', time: '' };
  try {
    const d = parseISO(iso);
    return {
      date: format(d, 'yyyy-MM-dd'),
      time: format(d, 'HH:mm'),
    };
  } catch {
    return { date: '', time: '' };
  }
}

function toISO(date: string, time: string): string | null {
  if (!date || !time) return null;
  return new Date(`${date}T${time}`).toISOString();
}

export const BlockManager = ({ eventId, blocks, onUpdate }: BlockManagerProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BlockDraft>(EMPTY_DRAFT);
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    if (!draft.name.trim()) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('blocks').insert({
        event_id: eventId,
        name: draft.name.trim(),
        start_time: toISO(draft.startDate, draft.startTime),
        end_time: toISO(draft.endDate, draft.endTime),
        order_index: blocks.length,
      });
      if (error) throw error;
      setDraft(EMPTY_DRAFT);
      setIsAdding(false);
      onUpdate();
    } catch (err) {
      console.error('Error adding block:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (block: Block) => {
    const start = toLocalInputs(block.start_time);
    const end = toLocalInputs(block.end_time);
    setEditingId(block.id);
    setDraft({
      name: block.name,
      startDate: start.date,
      startTime: start.time,
      endDate: end.date,
      endTime: end.time,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !draft.name.trim()) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('blocks')
        .update({
          name: draft.name.trim(),
          start_time: toISO(draft.startDate, draft.startTime),
          end_time: toISO(draft.endDate, draft.endTime),
        })
        .eq('id', editingId);
      if (error) throw error;
      setEditingId(null);
      setDraft(EMPTY_DRAFT);
      onUpdate();
    } catch (err) {
      console.error('Error updating block:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (blockId: string) => {
    try {
      const { error } = await supabase.from('blocks').delete().eq('id', blockId);
      if (error) throw error;
      onUpdate();
    } catch (err) {
      console.error('Error deleting block:', err);
    }
  };

  const handleReorder = async (blockId: string, direction: 'up' | 'down') => {
    const idx = blocks.findIndex(b => b.id === blockId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= blocks.length) return;

    try {
      await Promise.all([
        supabase.from('blocks').update({ order_index: swapIdx }).eq('id', blocks[idx].id),
        supabase.from('blocks').update({ order_index: idx }).eq('id', blocks[swapIdx].id),
      ]);
      onUpdate();
    } catch (err) {
      console.error('Error reordering blocks:', err);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  };

  const renderForm = (onSave: () => void) => (
    <div className="space-y-3 p-4 rounded-xl bg-card border border-border/50">
      <input
        type="text"
        placeholder="Block name (e.g. Friday Dinner) *"
        value={draft.name}
        onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
        className="w-full px-3 py-2 rounded-lg bg-muted border border-border/50 text-foreground
          text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        autoFocus
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Start</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={draft.startDate}
              onChange={e => setDraft(d => ({ ...d, startDate: e.target.value, endDate: d.endDate || e.target.value }))}
              className="flex-1 px-2 py-1.5 rounded-lg bg-muted border border-border/50 text-foreground
                text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="time"
              value={draft.startTime}
              onChange={e => setDraft(d => ({ ...d, startTime: e.target.value }))}
              className="w-24 px-2 py-1.5 rounded-lg bg-muted border border-border/50 text-foreground
                text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">End</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={draft.endDate}
              onChange={e => setDraft(d => ({ ...d, endDate: e.target.value }))}
              className="flex-1 px-2 py-1.5 rounded-lg bg-muted border border-border/50 text-foreground
                text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="time"
              value={draft.endTime}
              onChange={e => setDraft(d => ({ ...d, endTime: e.target.value }))}
              className="w-24 px-2 py-1.5 rounded-lg bg-muted border border-border/50 text-foreground
                text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button onClick={handleCancel}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
          Cancel
        </button>
        <button onClick={onSave} disabled={!draft.name.trim() || isSaving}
          className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium
            flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
          <Check className="w-3.5 h-3.5" />
          {isSaving ? 'Saving...' : editingId ? 'Save' : 'Add Block'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Calendar className="w-4 h-4 text-primary" />
          Time Blocks ({blocks.length})
        </div>
        {!isAdding && !editingId && (
          <button onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium
              flex items-center gap-1.5 hover:opacity-90 transition-opacity">
            <Plus className="w-3.5 h-3.5" />
            Add Block
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
        {blocks.length === 0 && !isAdding && (
          <div className="p-6 text-center text-muted-foreground rounded-xl bg-card border border-border/50">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No time blocks yet. Add blocks to define your schedule.</p>
          </div>
        )}

        {blocks.map((block, index) => (
          <motion.div
            key={block.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
          >
            {editingId === block.id ? (
              renderForm(handleSaveEdit)
            ) : (
              <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50
                hover:border-primary/20 transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">{block.name}</div>
                    {block.start_time && (
                      <div className="text-xs text-muted-foreground">
                        {format(parseISO(block.start_time), 'EEE, MMM d · h:mm a')}
                        {block.end_time && <> — {format(parseISO(block.end_time), 'h:mm a')}</>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => handleReorder(block.id, 'up')} disabled={index === 0}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-30" title="Move up">
                    <ArrowUp className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleReorder(block.id, 'down')} disabled={index === blocks.length - 1}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-30" title="Move down">
                    <ArrowDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleEdit(block)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Edit">
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(block.id)}
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

export default BlockManager;
