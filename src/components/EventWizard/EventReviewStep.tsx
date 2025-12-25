import { Calendar, MapPin, Users, HelpCircle, Clock } from "lucide-react";
import type { EventFormData } from "@/pages/CreateEvent";

interface EventReviewStepProps {
  formData: EventFormData;
}

const EventReviewStep = ({ formData }: EventReviewStepProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review Your Event</h2>
        <p className="text-muted-foreground">
          Here's a summary. You can go back to make changes.
        </p>
      </div>

      <div className="space-y-4">
        {/* Event basics */}
        <div className="p-4 rounded-lg border border-border bg-muted/20">
          <h3 className="font-semibold text-lg mb-3">
            {formData.title || "Untitled Event"}
          </h3>
          
          {formData.description && (
            <p className="text-muted-foreground text-sm mb-3">
              {formData.description}
            </p>
          )}

          <div className="space-y-2 text-sm">
            {formData.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {formData.location}
              </div>
            )}
            {formData.startDate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {new Date(formData.startDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                {formData.endDate && (
                  <span>
                    {" → "}
                    {new Date(formData.endDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Blocks */}
        {formData.blocks.length > 0 && (
          <div className="p-4 rounded-lg border border-border bg-muted/20">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{formData.blocks.length} Time Block(s)</span>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {formData.blocks.map((block, index) => (
                <li key={index}>• {block.name || `Block ${index + 1}`}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Questions */}
        {formData.questions.length > 0 && (
          <div className="p-4 rounded-lg border border-border bg-muted/20">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="w-4 h-4" />
              <span className="font-medium">{formData.questions.length} Question(s)</span>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {formData.questions.map((q, index) => (
                <li key={index}>• {q.prompt || `Question ${index + 1}`}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Guests */}
        {formData.guests.length > 0 && (
          <div className="p-4 rounded-lg border border-border bg-muted/20">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4" />
              <span className="font-medium">{formData.guests.length} Guest(s)</span>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {formData.guests.map((guest, index) => (
                <li key={index}>
                  • {guest.name || `Guest ${index + 1}`}
                  {guest.email && ` (${guest.email})`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Empty state */}
        {!formData.title &&
          formData.blocks.length === 0 &&
          formData.questions.length === 0 &&
          formData.guests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No event details yet. Go back to add some!</p>
            </div>
          )}
      </div>
    </div>
  );
};

export default EventReviewStep;
