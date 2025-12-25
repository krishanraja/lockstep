import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import EventBasicsStep from "@/components/EventWizard/EventBasicsStep";
import EventBlocksStep from "@/components/EventWizard/EventBlocksStep";
import EventQuestionsStep from "@/components/EventWizard/EventQuestionsStep";
import EventGuestsStep from "@/components/EventWizard/EventGuestsStep";
import EventReviewStep from "@/components/EventWizard/EventReviewStep";

export interface EventFormData {
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  blocks: { name: string; startTime: string; endTime: string }[];
  questions: { type: string; prompt: string; options?: string[] }[];
  guests: { name: string; email: string; phone: string }[];
}

const initialFormData: EventFormData = {
  title: "",
  description: "",
  location: "",
  startDate: "",
  endDate: "",
  blocks: [],
  questions: [],
  guests: [],
};

const steps = [
  { id: "basics", title: "Event Details" },
  { id: "blocks", title: "Time Blocks" },
  { id: "questions", title: "Questions" },
  { id: "guests", title: "Guests" },
  { id: "review", title: "Review" },
];

const CreateEvent = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const updateFormData = (updates: Partial<EventFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Please sign in",
          description: "You need to be signed in to create an event.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Create event
      const { data: event, error: eventError } = await supabase
        .from("events")
        .insert({
          organiser_id: user.id,
          title: formData.title,
          description: formData.description,
          location: formData.location,
          start_date: formData.startDate || null,
          end_date: formData.endDate || null,
          status: "draft",
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Create blocks
      if (formData.blocks.length > 0) {
        const { error: blocksError } = await supabase.from("blocks").insert(
          formData.blocks.map((block, index) => ({
            event_id: event.id,
            name: block.name,
            start_time: block.startTime || null,
            end_time: block.endTime || null,
            order_index: index,
          }))
        );
        if (blocksError) throw blocksError;
      }

      // Create questions
      if (formData.questions.length > 0) {
        const { error: questionsError } = await supabase.from("questions").insert(
          formData.questions.map((q, index) => ({
            event_id: event.id,
            type: q.type,
            prompt: q.prompt,
            options: q.options || null,
            order_index: index,
          }))
        );
        if (questionsError) throw questionsError;
      }

      // Create guests
      if (formData.guests.length > 0) {
        const { error: guestsError } = await supabase.from("guests").insert(
          formData.guests.map((g) => ({
            event_id: event.id,
            name: g.name,
            email: g.email || null,
            phone: g.phone || null,
          }))
        );
        if (guestsError) throw guestsError;
      }

      toast({
        title: "Event created!",
        description: "Your event has been created successfully.",
      });

      navigate(`/dashboard/${event.id}`);
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast({
        title: "Error creating event",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <EventBasicsStep formData={formData} updateFormData={updateFormData} />;
      case 1:
        return <EventBlocksStep formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <EventQuestionsStep formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <EventGuestsStep formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <EventReviewStep formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-lg font-medium">Create Event</h1>
          <div className="w-12" />
        </div>
      </header>

      {/* Progress steps */}
      <div className="border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    index < currentStep
                      ? "bg-primary text-primary-foreground"
                      : index === currentStep
                      ? "bg-button-bg text-button-text border-2 border-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`hidden sm:block w-12 h-0.5 mx-2 ${
                      index < currentStep ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2">
            {steps[currentStep].title}
          </p>
        </div>
      </div>

      {/* Step content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/50">
          <button
            onClick={goPrev}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentStep === 0
                ? "opacity-50 cursor-not-allowed text-muted-foreground"
                : "bg-button-bg text-button-text hover:opacity-80"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {currentStep === steps.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Event"}
              <Check className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-button-bg text-button-text hover:opacity-80 transition-opacity"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default CreateEvent;
