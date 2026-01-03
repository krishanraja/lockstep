import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GripVertical, Trash2, Plus, Clock, Check } from 'lucide-react';
import type { BlockTemplate } from '@/data/templates/types';

interface EditableBlock extends BlockTemplate {
  id: string;
}

interface EditTimeBlocksModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: BlockTemplate[];
  onSave: (blocks: BlockTemplate[]) => void;
}

export function EditTimeBlocksModal({
  isOpen,
  onClose,
  blocks,
  onSave,
}: EditTimeBlocksModalProps) {
  // Convert to editable blocks with IDs
  const [editableBlocks, setEditableBlocks] = useState<EditableBlock[]>(() =>
    blocks.map((block, index) => ({
      ...block,
      id: `block-${index}-${Date.now()}`,
    }))
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleStartEdit = (block: EditableBlock) => {
    setEditingId(block.id);
    setEditValue(block.name);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editValue.trim()) return;
    
    setEditableBlocks(prev =>
      prev.map(block =>
        block.id === editingId
          ? { ...block, name: editValue.trim() }
          : block
      )
    );
    setEditingId(null);
    setEditValue('');
  };

  const handleDelete = (id: string) => {
    setEditableBlocks(prev => prev.filter(block => block.id !== id));
  };

  const handleAddBlock = () => {
    const newBlock: EditableBlock = {
      id: `block-new-${Date.now()}`,
      name: 'New Activity',
      defaultDuration: 2,
      attendanceRequired: false,
    };
    setEditableBlocks(prev => [...prev, newBlock]);
    // Start editing the new block
    setTimeout(() => handleStartEdit(newBlock), 100);
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = editableBlocks.findIndex(b => b.id === draggedId);
    const targetIndex = editableBlocks.findIndex(b => b.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newBlocks = [...editableBlocks];
    const [draggedBlock] = newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(targetIndex, 0, draggedBlock);
    setEditableBlocks(newBlocks);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleSaveAll = () => {
    // Convert back to BlockTemplate (remove IDs)
    const savedBlocks: BlockTemplate[] = editableBlocks.map(({ id, ...block }) => block);
    onSave(savedBlocks);
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
            <h2 className="text-lg font-semibold">Edit Time Blocks</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Block List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {editableBlocks.map((block) => (
              <motion.div
                key={block.id}
                layout
                draggable
                onDragStart={() => handleDragStart(block.id)}
                onDragOver={(e) => handleDragOver(e, block.id)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50
                  ${draggedId === block.id ? 'opacity-50' : ''}
                  ${editingId === block.id ? 'ring-2 ring-primary' : ''}
                `}
              >
                {/* Drag Handle */}
                <div className="cursor-grab active:cursor-grabbing text-muted-foreground">
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Block Content */}
                <div className="flex-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  
                  {editingId === block.id ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') {
                          setEditingId(null);
                          setEditValue('');
                        }
                      }}
                      autoFocus
                      className="flex-1 bg-transparent border-none outline-none text-foreground"
                    />
                  ) : (
                    <button
                      onClick={() => handleStartEdit(block)}
                      className="flex-1 text-left text-foreground hover:text-primary transition-colors"
                    >
                      {block.name}
                    </button>
                  )}

                  <span className="text-xs text-muted-foreground">
                    {block.defaultDuration}h
                  </span>
                </div>

                {/* Actions */}
                {editingId === block.id ? (
                  <button
                    onClick={handleSaveEdit}
                    className="p-1.5 rounded-full text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleDelete(block.id)}
                    className="p-1.5 rounded-full text-muted-foreground hover:text-destructive 
                      hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}

            {/* Add Block Button */}
            <button
              onClick={handleAddBlock}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl
                border-2 border-dashed border-border/50 text-muted-foreground
                hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Time Block
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




