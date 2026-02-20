import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Trash2, Plus, Check, Calendar, Library } from 'lucide-react';
import type { CheckpointTemplate } from '@/data/templates/types';
import { CHECKPOINT_PRESETS } from '@/data/question-library';

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
  const [editType, setEditType] = useState<'reminder' | 'deadline' | 'final'>('reminder');
  const [showLibrary, setShowLibrary] = useState(false);

  // Get presets that aren't already added
  const availablePresets = CHECKPOINT_PRESETS.filter(preset => 
    !editableCheckpoints.some(cp => cp.name === preset.name)
  );

  const handleStartEdit = (checkpoint: EditableCheckpoint) => {
    setEditingId(checkpoint.id);
    setEditName(checkpoint.name);
    setEditDays(checkpoint.offsetDays);
    setEditType(checkpoint.type);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;
    
    setEditableCheckpoints(prev =>
      prev.map(cp =>
        cp.id === editingId
          ? { ...cp, name: editName.trim(), offsetDays: editDays, type: editType }
          : cp
      )
    );
    setEditingId(null);
    setEditName('');
    setEditDays(0);
    setEditType('reminder');
  };

  const handleDelete = (id: string) => {
    setEditableCheckpoints(prev => prev.filter(cp => cp.id !== id));
  };

  // Add checkpoint from preset library (no free text)
  const handleAddFromPreset = (preset: typeof CHECKPOINT_PRESETS[0]) => {
    const newCheckpoint: EditableCheckpoint = {
      id: `cp-${preset.id}-${Date.now()}`,
      name: preset.name,
      offsetDays: preset.offsetDays,
      type: preset.type,
    };
    setEditableCheckpoints(prev => [...prev, newCheckpoint]);
    setShowLibrary(false);
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
                    {/* Checkpoint name - dropdown from presets */}
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Checkpoint name</label>
                      <select
                        value={editName}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setEditName(newName);
                          // Auto-set days and type if selecting a preset
                          const preset = CHECKPOINT_PRESETS.find(p => p.name === newName);
                          if (preset) {
                            setEditDays(preset.offsetDays);
                            setEditType(preset.type);
                          }
                        }}
                        className="w-full bg-muted px-3 py-2 rounded-lg text-foreground outline-none
                          focus:ring-2 focus:ring-primary"
                      >
                        <option value={editName}>{editName}</option>
                        {CHECKPOINT_PRESETS.filter(p => p.name !== editName).map(preset => (
                          <option key={preset.id} value={preset.name}>{preset.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Timing and type */}
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-1">
                        <label className="text-xs text-muted-foreground">When</label>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <select
                            value={editDays}
                            onChange={(e) => setEditDays(parseInt(e.target.value))}
                            className="flex-1 bg-muted px-3 py-2 rounded-lg text-foreground outline-none
                              focus:ring-2 focus:ring-primary"
                          >
                            {[-30, -21, -14, -10, -7, -3, -2, -1, 0].map(days => (
                              <option key={days} value={days}>
                                {formatOffsetDays(days)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-xs text-muted-foreground">Type</label>
                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value as typeof editType)}
                          className="w-full bg-muted px-3 py-2 rounded-lg text-foreground outline-none
                            focus:ring-2 focus:ring-primary"
                        >
                          <option value="reminder">Reminder</option>
                          <option value="deadline">Deadline</option>
                          <option value="final">Final Notice</option>
                        </select>
                      </div>
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

            {/* Add Checkpoint from Presets */}
            {!showLibrary ? (
              <button
                onClick={() => setShowLibrary(true)}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl
                  border-2 border-dashed border-border/50 text-muted-foreground
                  hover:border-primary hover:text-primary transition-colors"
              >
                <Library className="w-4 h-4" />
                Add Checkpoint
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Select a checkpoint:</p>
                  <button
                    onClick={() => setShowLibrary(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {availablePresets.length > 0 ? (
                    availablePresets.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => handleAddFromPreset(preset)}
                        className="w-full text-left p-2 rounded-lg bg-muted/50 hover:bg-muted
                          transition-colors group"
                      >
                        <p className="text-sm text-foreground group-hover:text-primary">
                          {preset.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatOffsetDays(preset.offsetDays)} • {checkpointTypeLabels[preset.type]}
                        </p>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      All checkpoint types have been added
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





