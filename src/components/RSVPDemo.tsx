import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Minus, HelpCircle } from "lucide-react";
import { Reveal } from "@/components/animations/Reveal";
import { GlassCard } from "@/components/animations/InteractiveElements";

type Status = "in" | "out" | "maybe";

interface TimeBlock {
  id: string;
  name: string;
  time: string;
  status: Status;
}

const RSVPDemo = () => {
  const [blocks, setBlocks] = useState<TimeBlock[]>([
    { id: "1", name: "Friday Night", time: "6pm onwards", status: "in" },
    { id: "2", name: "Saturday Daytime", time: "10am - 4pm", status: "in" },
    { id: "3", name: "Saturday Dinner", time: "7pm - 10pm", status: "maybe" },
    { id: "4", name: "Sunday Brunch", time: "10am - 1pm", status: "out" },
  ]);

  const updateStatus = (id: string, newStatus: Status) => {
    setBlocks(prev => 
      prev.map(block => 
        block.id === id ? { ...block, status: newStatus } : block
      )
    );
  };

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden px-4 md:px-8 py-6 md:py-10">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
        {/* Section header */}
        <div className="text-center mb-6 md:mb-8">
          <Reveal>
            <p className="text-xs font-medium text-primary mb-2 tracking-wider uppercase">
              Guest Experience
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display text-display-md md:text-display-lg font-bold text-foreground mb-2">
              15 seconds to respond
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-sm text-muted-foreground">
              No app to download. No account to create.
            </p>
          </Reveal>
        </div>

        {/* RSVP Card */}
        <Reveal delay={0.3} direction="scale">
          <GlassCard className="overflow-hidden">
            {/* Header */}
            <div className="p-4 md:p-5 border-b border-border/50">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                You're invited to
              </p>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Tom's Bucks Weekend
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                March 14-16 • Byron Bay
              </p>
            </div>

            {/* Time blocks */}
            <div className="p-3 md:p-4 space-y-2">
              {blocks.map((block, index) => (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                >
                  <TimeBlockRow 
                    block={block} 
                    onStatusChange={(status) => updateStatus(block.id, status)} 
                  />
                </motion.div>
              ))}
            </div>

            {/* Submit */}
            <div className="p-4 md:p-5 pt-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-3 bg-button-bg text-button-text font-medium rounded-xl text-sm"
              >
                Confirm my availability
              </motion.button>
            </div>
          </GlassCard>
        </Reveal>
      </div>
    </div>
  );
};

const TimeBlockRow = ({ 
  block, 
  onStatusChange 
}: { 
  block: TimeBlock; 
  onStatusChange: (status: Status) => void;
}) => {
  return (
    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
      <div className="flex-1 min-w-0 mr-3">
        <p className="text-sm font-medium text-foreground truncate">{block.name}</p>
        <p className="text-[10px] text-muted-foreground">{block.time}</p>
      </div>
      
      <div className="flex items-center gap-1">
        <StatusButton 
          status="in" 
          active={block.status === "in"} 
          onClick={() => onStatusChange("in")}
        />
        <StatusButton 
          status="maybe" 
          active={block.status === "maybe"} 
          onClick={() => onStatusChange("maybe")}
        />
        <StatusButton 
          status="out" 
          active={block.status === "out"} 
          onClick={() => onStatusChange("out")}
        />
      </div>
    </div>
  );
};

const StatusButton = ({ 
  status, 
  active, 
  onClick 
}: { 
  status: Status; 
  active: boolean; 
  onClick: () => void;
}) => {
  const config = {
    in: { 
      icon: <Check className="w-3.5 h-3.5" />, 
      activeClass: "bg-confirmed/20 text-confirmed border-confirmed/40",
      label: "In"
    },
    maybe: { 
      icon: <HelpCircle className="w-3.5 h-3.5" />, 
      activeClass: "bg-maybe/20 text-maybe border-maybe/40",
      label: "Maybe"
    },
    out: { 
      icon: <Minus className="w-3.5 h-3.5" />, 
      activeClass: "bg-out/20 text-out border-out/40",
      label: "Out"
    },
  };

  const { icon, activeClass, label } = config[status];

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-label={label}
      className={`
        w-8 h-8 rounded-lg border flex items-center justify-center
        transition-all duration-200
        ${active 
          ? activeClass 
          : "bg-background border-border text-muted-foreground hover:text-foreground"
        }
      `}
    >
      {icon}
    </motion.button>
  );
};

export default RSVPDemo;
