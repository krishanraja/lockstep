import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, RefreshCw, Calendar, Users, Bell, Settings, ChevronRight, Camera } from 'lucide-react';
import { format } from 'date-fns';
import type { EventTemplate, BlockTemplate, CheckpointTemplate, QuestionTemplate } from '@/data/templates/types';
import { EditTimeBlocksModal } from '../components/EditTimeBlocksModal';
import { EditCheckpointsModal } from '../components/EditCheckpointsModal';
import { EditQuestionsModal } from '../components/EditQuestionsModal';
import { EventPhotoSelector } from '../components/EventPhotoSelector';

interface ConfirmStepProps {
  template: EventTemplate;
  eventName: string;
  dateRange: { start: Date; end: Date };
  locationText: string;
  aiDescription: string;
  isGeneratingDescription: boolean;
  onRegenerateDescription: () => void;
  onCustomize: () => void;
  onConfirm: () => void;
  // Edit callbacks
  customBlocks?: BlockTemplate[];
  customCheckpoints?: CheckpointTemplate[];
  customQuestions?: QuestionTemplate[];
  onBlocksChange?: (blocks: BlockTemplate[]) => void;
  onCheckpointsChange?: (checkpoints: CheckpointTemplate[]) => void;
  onQuestionsChange?: (questions: QuestionTemplate[]) => void;
  // Photo
  coverImageUrl?: string;
  onCoverImageChange?: (url: string) => void;
}

export function ConfirmStep({
  template,
  eventName,
  dateRange,
  locationText,
  aiDescription,
  isGeneratingDescription,
  onRegenerateDescription,
  onCustomize,
  onConfirm,
  customBlocks,
  customCheckpoints,
  customQuestions,
  onBlocksChange,
  onCheckpointsChange,
  onQuestionsChange,
  coverImageUrl,
  onCoverImageChange,
}: ConfirmStepProps) {
  const [showBlocksModal, setShowBlocksModal] = useState(false);
  const [showCheckpointsModal, setShowCheckpointsModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  
  // Use custom values if provided, otherwise use template defaults
  const blocks = customBlocks || template.blocks;
  const checkpoints = customCheckpoints || template.checkpoints;
  const questions = customQuestions || template.questions;
  
  // Generate description on mount if not already generated
  useEffect(() => {
    if (!aiDescription && !isGeneratingDescription) {
      onRegenerateDescription();
    }
  }, []);

  const formatDateRange = () => {
    const start = format(dateRange.start, 'MMM d');
    const end = format(dateRange.end, 'MMM d, yyyy');
    return `${start} - ${end}`;
  };

  const handleBlocksSave = (newBlocks: BlockTemplate[]) => {
    onBlocksChange?.(newBlocks);
  };

  const handleCheckpointsSave = (newCheckpoints: CheckpointTemplate[]) => {
    onCheckpointsChange?.(newCheckpoints);
  };

  const handleQuestionsSave = (newQuestions: QuestionTemplate[]) => {
    onQuestionsChange?.(newQuestions);
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="flex-1 px-6 py-8 pb-32">
        {/* Header with check */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-6"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">
            {eventName}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {locationText} • {formatDateRange()}
          </p>
        </motion.div>

      {/* Cover Photo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="max-w-sm mx-auto w-full mb-4"
      >
        <button
          onClick={() => setShowPhotoSelector(true)}
          className="w-full aspect-[2.5/1] rounded-2xl overflow-hidden relative group"
        >
          {coverImageUrl ? (
            <>
              <img 
                src={coverImageUrl} 
                alt="Event cover" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 
                transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 
              border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-2
              group-hover:border-primary/50 transition-colors">
              <Camera className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                Add cover photo
              </span>
            </div>
          )}
        </button>
      </motion.div>

      {/* AI Description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="max-w-sm mx-auto w-full"
      >
        <div className="p-4 rounded-2xl bg-card border border-border/50">
          {isGeneratingDescription ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="w-5 h-5 text-primary animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Writing description...</span>
            </div>
          ) : (
            <>
              <p className="text-foreground text-sm leading-relaxed">
                "{aiDescription || 'Your event description will appear here...'}"
              </p>
              <button
                onClick={onRegenerateDescription}
                className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Regenerate
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* What's been set up - Clickable items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-6 max-w-sm mx-auto w-full space-y-2"
      >
        {/* Time Blocks */}
        <button
          onClick={() => setShowBlocksModal(true)}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/30
            hover:bg-card hover:border-border/50 transition-colors text-left group"
        >
          <div className="w-8 h-8 rounded-full bg-confirmed/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-confirmed" />
          </div>
          <span className="flex-1 text-sm text-foreground">
            {blocks.length} time block{blocks.length !== 1 ? 's' : ''} set up
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
        
        {/* Checkpoints */}
        <button
          onClick={() => setShowCheckpointsModal(true)}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/30
            hover:bg-card hover:border-border/50 transition-colors text-left group"
        >
          <div className="w-8 h-8 rounded-full bg-confirmed/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-confirmed" />
          </div>
          <span className="flex-1 text-sm text-foreground">
            {checkpoints.length} reminder checkpoint{checkpoints.length !== 1 ? 's' : ''}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
        
        {/* Questions */}
        <button
          onClick={() => setShowQuestionsModal(true)}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/30
            hover:bg-card hover:border-border/50 transition-colors text-left group"
        >
          <div className="w-8 h-8 rounded-full bg-confirmed/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-confirmed" />
          </div>
          <span className="flex-1 text-sm text-foreground">
            {questions.length} question{questions.length !== 1 ? 's' : ''} for guests
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="pt-6 max-w-sm mx-auto w-full space-y-3"
        >
          <button
            onClick={onConfirm}
            disabled={isGeneratingDescription}
            className="w-full py-4 rounded-2xl
              bg-primary text-primary-foreground font-medium
              flex items-center justify-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:opacity-90 transition-opacity"
          >
            Looks Good
            <Check className="w-5 h-5" />
          </button>
          
          <button
            onClick={onCustomize}
            className="w-full py-3 rounded-2xl
              bg-transparent text-muted-foreground font-medium
              flex items-center justify-center gap-2
              hover:text-foreground transition-colors"
          >
            <Settings className="w-4 h-4" />
            Edit Event
          </button>
        </motion.div>
      </div>

      {/* Edit Modals */}
      <EditTimeBlocksModal
        isOpen={showBlocksModal}
        onClose={() => setShowBlocksModal(false)}
        blocks={blocks}
        onSave={handleBlocksSave}
      />
      
      <EditCheckpointsModal
        isOpen={showCheckpointsModal}
        onClose={() => setShowCheckpointsModal(false)}
        checkpoints={checkpoints}
        onSave={handleCheckpointsSave}
      />
      
      <EditQuestionsModal
        isOpen={showQuestionsModal}
        onClose={() => setShowQuestionsModal(false)}
        questions={questions}
        onSave={handleQuestionsSave}
      />
      
      <EventPhotoSelector
        isOpen={showPhotoSelector}
        onClose={() => setShowPhotoSelector(false)}
        onSelect={(url) => onCoverImageChange?.(url)}
        currentImage={coverImageUrl}
        eventType={template.label}
      />
    </div>
  );
}
