import * as React from "react";

import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";

const inputVariants = cva(
  "flex rounded-sm border border-input shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "bg-transparent text-base",
        vscode: "vscode-input",
      },
      sizeVariant: {
        default: "h-9 px-3 py-1",
        sm: "h-7 rounded-sm px-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      sizeVariant: "default",
    },
  }
);

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, sizeVariant, variant, ...props }, ref) => {
  return <input type={type} className={cn(inputVariants({ variant, sizeVariant, className }))} ref={ref} {...props} />;
});
Input.displayName = "Input";

export { Input };
