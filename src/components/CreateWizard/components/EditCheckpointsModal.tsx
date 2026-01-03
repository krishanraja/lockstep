import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Trash2, Plus, Check, Calendar } from 'lucide-react';
import type { CheckpointTemplate } from '@/data/templates/types';

interface EditableCheckpoint extends CheckpointTemplate {
  id: string;
}

interface EditCheckpointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkpoints: CheckpointTemplate[];
  onSave: (checkpoints: CheckpointTemplate[]) => void;
}

const checkpointTypeLabels: Record<string, string> = {
  reminder: 'Reminder',
  deadline: 'Deadline',
  final: 'Final Notice',
};

export function EditCheckpointsModal({
  isOpen,
  onClose,
  checkpoints,
  onSave,
}: EditCheckpointsModalProps) {
  const [editableCheckpoints, setEditableCheckpoints] = useState<EditableCheckpoint[]>(() =>
    checkpoints.map((cp, index) => ({
      ...cp,
      id: `cp-${index}-${Date.now()}`,
    }))
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDays, setEditDays] = useState(0);

  const handleStartEdit = (checkpoint: EditableCheckpoint) => {
    setEditingId(checkpoint.id);
    setEditName(checkpoint.name);
    setEditDays(checkpoint.offsetDays);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;
    
    setEditableCheckpoints(prev =>
      prev.map(cp =>
        cp.id === editingId
          ? { ...cp, name: editName.trim(), offsetDays: editDays }
          : cp
      )
    );
    setEditingId(null);
    setEditName('');
    setEditDays(0);
  };

  const handleDelete = (id: string) => {
    setEditableCheckpoints(prev => prev.filter(cp => cp.id !== id));
  };

  const handleAddCheckpoint = () => {
    const newCheckpoint: EditableCheckpoint = {
      id: `cp-new-${Date.now()}`,
      name: 'New Reminder',
      offsetDays: -7,
      type: 'reminder',
    };
    setEditableCheckpoints(prev => [...prev, newCheckpoint]);
    setTimeout(() => handleStartEdit(newCheckpoint), 100);
  };

  const handleSaveAll = () => {
    const savedCheckpoints: CheckpointTemplate[] = editableCheckpoints.map(({ id, ...cp }) => cp);
    onSave(savedCheckpoints);
    onClose();
  };

  const formatOffsetDays = (days: number): string => {
    if (days === 0) return 'Event day';
    if (days === -1) return '1 day before';
    if (days < 0) return `${Math.abs(days)} days before`;
    if (days === 1) return '1 day after';
    return `${days} days after`;
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
            <h2 className="text-lg font-semibold">Edit Checkpoints</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Checkpoint List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {editableCheckpoints.map((checkpoint) => (
              <motion.div
                key={checkpoint.id}
                layout
                className={`p-3 rounded-xl bg-card border border-border/50
                  ${editingId === checkpoint.id ? 'ring-2 ring-primary' : ''}
                `}
              >
                {editingId === checkpoint.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Checkpoint name"
                      autoFocus
                      className="w-full bg-muted px-3 py-2 rounded-lg text-foreground outline-none
                        focus:ring-2 focus:ring-primary"
                    />
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <select
                        value={editDays}
                        onChange={(e) => setEditDays(parseInt(e.target.value))}
                        className="flex-1 bg-muted px-3 py-2 rounded-lg text-foreground outline-none
                          focus:ring-2 focus:ring-primary"
                      >
                        {[-30, -21, -14, -7, -3, -1, 0].map(days => (
                          <option key={days} value={days}>
                            {formatOffsetDays(days)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditName('');
                          setEditDays(0);
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
                    <div className="w-8 h-8 rounded-full bg-confirmed/10 flex items-center justify-center">
                      <Bell className="w-4 h-4 text-confirmed" />
                    </div>
                    <button
                      onClick={() => handleStartEdit(checkpoint)}
                      className="flex-1 text-left"
                    >
                      <p className="text-foreground font-medium">{checkpoint.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatOffsetDays(checkpoint.offsetDays)} • {checkpointTypeLabels[checkpoint.type] || checkpoint.type}
                      </p>
                    </button>
                    <button
                      onClick={() => handleDelete(checkpoint.id)}
                      className="p-1.5 rounded-full text-muted-foreground hover:text-destructive 
                        hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}

            {/* Add Checkpoint Button */}
            <button
              onClick={handleAddCheckpoint}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl
                border-2 border-dashed border-border/50 text-muted-foreground
                hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Checkpoint
            </button>
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




