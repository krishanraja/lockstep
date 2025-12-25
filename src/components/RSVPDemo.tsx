import { motion } from "framer-motion";
import { useState } from "react";
import { Check, Minus, HelpCircle } from "lucide-react";

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
    { id: "4", name: "Saturday Night", time: "10pm onwards", status: "in" },
    { id: "5", name: "Sunday Brunch", time: "10am - 1pm", status: "out" },
  ]);

  const updateStatus = (id: string, newStatus: Status) => {
    setBlocks(prev => 
      prev.map(block => 
        block.id === id ? { ...block, status: newStatus } : block
      )
    );
  };

  return (
    <section className="relative py-32 px-6 bg-secondary/30">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-6">
            15 seconds to respond
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No app to download. No account to create. Guests tap a link and answer—that's it.
          </p>
        </motion.div>

        {/* RSVP Demo Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="max-w-md mx-auto"
        >
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
            {/* Header */}
            <div className="p-6 border-b border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                You're invited to
              </p>
              <h3 className="text-xl font-semibold text-foreground">
                Tom's Bucks Weekend
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                March 14-16 • Byron Bay
              </p>
            </div>

            {/* Time blocks */}
            <div className="p-4 space-y-3">
              {blocks.map((block, index) => (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.1 + index * 0.08,
                    ease: [0.4, 0, 0.2, 1] 
                  }}
                >
                  <TimeBlockRow 
                    block={block} 
                    onStatusChange={(status) => updateStatus(block.id, status)} 
                  />
                </motion.div>
              ))}
            </div>

            {/* Submit */}
            <div className="p-6 pt-4">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-4 bg-primary text-primary-foreground font-medium rounded-xl transition-all duration-300 hover:bg-primary/90"
              >
                Confirm my availability
              </motion.button>
              <p className="text-xs text-center text-muted-foreground mt-4">
                You can update this later if plans change
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
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
    <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm font-medium text-foreground truncate">{block.name}</p>
        <p className="text-xs text-muted-foreground">{block.time}</p>
      </div>
      
      <div className="flex items-center gap-1.5">
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
      icon: <Check className="w-4 h-4" />, 
      activeClass: "bg-confirmed/20 text-confirmed border-confirmed/40",
      label: "In"
    },
    maybe: { 
      icon: <HelpCircle className="w-4 h-4" />, 
      activeClass: "bg-maybe/20 text-maybe border-maybe/40",
      label: "Maybe"
    },
    out: { 
      icon: <Minus className="w-4 h-4" />, 
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
        w-10 h-10 rounded-lg border flex items-center justify-center
        transition-all duration-300
        ${active 
          ? activeClass 
          : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
        }
      `}
    >
      {icon}
    </motion.button>
  );
};

export default RSVPDemo;
