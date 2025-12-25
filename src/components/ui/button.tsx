import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-300 ease-lockstep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg",
        outline: "border border-border bg-transparent text-foreground hover:bg-secondary rounded-lg",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg",
        ghost: "hover:bg-secondary text-foreground rounded-lg",
        link: "text-primary underline-offset-4 hover:underline",
        // Lockstep Hero Button - Primary CTA
        hero: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-400",
        // Lockstep Subtle Button
        subtle: "bg-transparent border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground rounded-lg transition-all duration-300",
        // Status Buttons
        confirmed: "bg-confirmed/15 text-confirmed border border-confirmed/30 hover:bg-confirmed/25 rounded-lg",
        maybe: "bg-maybe/15 text-maybe border border-maybe/30 hover:bg-maybe/25 rounded-lg",
        out: "bg-out/15 text-out border border-out/30 hover:bg-out/25 rounded-lg",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-4 text-xs",
        lg: "h-13 px-8 py-3 text-base",
        xl: "h-14 px-10 py-4 text-base font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
