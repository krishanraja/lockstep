// EventActionsMenu - Dropdown menu for event management actions
import { useState } from 'react';
import { 
  MoreHorizontal, 
  Edit3, 
  Share2, 
  Download, 
  Archive, 
  Trash2,
  Copy,
  Check
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

interface EventActionsMenuProps {
  eventId: string;
  eventTitle: string;
  eventStatus: string | null;
  onEdit: () => void;
  onExport: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

export const EventActionsMenu = ({
  eventId,
  eventTitle,
  eventStatus,
  onEdit,
  onExport,
  onArchive,
  onDelete,
}: EventActionsMenuProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShare = async () => {
    const eventLink = `${window.location.origin}/events/${eventId}`;
    try {
      await navigator.clipboard.writeText(eventLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'completed' })
        .eq('id', eventId);
      
      if (error) throw error;
      
      onArchive?.();
      setShowArchiveDialog(false);
    } catch (err) {
      console.error('Failed to archive event:', err);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
      
      if (error) throw error;
      
      onDelete?.();
    } catch (err) {
      console.error('Failed to delete event:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const isArchived = eventStatus === 'completed' || eventStatus === 'cancelled';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            className="p-2 rounded-full hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label="Event actions"
          >
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Event
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 mr-2 text-confirmed" />
                <span className="text-confirmed">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 mr-2" />
                Share Event
              </>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={onExport} className="cursor-pointer">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {!isArchived && (
            <DropdownMenuItem 
              onClick={() => setShowArchiveDialog(true)}
              className="cursor-pointer"
            >
              <Archive className="w-4 h-4 mr-2" />
              Archive Event
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Event
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this event?</AlertDialogTitle>
            <AlertDialogDescription>
              Archiving "{eventTitle}" will mark it as completed. 
              You can still view the event and its data, but it won't appear in your active events.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleArchive}
              disabled={isArchiving}
              className="bg-primary"
            >
              {isArchiving ? 'Archiving...' : 'Archive Event'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{eventTitle}" and all associated data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All guest information</li>
                <li>All RSVP responses</li>
                <li>All scheduled reminders</li>
              </ul>
              <span className="block mt-2 font-medium text-destructive">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Event'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EventActionsMenu;
