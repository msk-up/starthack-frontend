import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl hover:scale-[1.02]",
        glass: "bg-glass-bg/60 backdrop-blur-xl border border-glass-border/60 text-foreground hover:bg-glass-bg/80 hover:border-primary/40 shadow-lg hover:shadow-xl hover:scale-[1.02]",
        glassPrimary: "bg-primary/10 backdrop-blur-xl border border-primary/30 text-primary hover:bg-primary/20 hover:border-primary/50 shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:scale-[1.02]",
        glassAccent: "bg-accent/10 backdrop-blur-xl border border-accent/30 text-accent hover:bg-accent/20 hover:border-accent/50 shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:scale-[1.02]",
        gradient: "bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:scale-[1.02]",
        gradientAccent: "bg-gradient-to-br from-accent to-primary text-accent-foreground shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:scale-[1.02]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg hover:shadow-xl hover:scale-[1.02]",
        outline: "border-2 border-input bg-background hover:bg-accent/50 hover:text-accent-foreground hover:border-primary/40 hover:scale-[1.02]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-lg hover:shadow-xl hover:scale-[1.02]",
        ghost: "hover:bg-accent/50 hover:text-accent-foreground hover:scale-[1.02]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-13 rounded-xl px-10 text-base",
        icon: "h-11 w-11",
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
