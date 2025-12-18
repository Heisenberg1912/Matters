import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";

import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out",
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

type SheetSide = "left" | "right" | "top" | "bottom";

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & { side?: SheetSide }
>(({ className, children, side = "left", ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 bg-[#121212] text-white shadow-2xl transition data-[state=open]:animate-in data-[state=closed]:animate-out overflow-y-auto",
        "p-5 xs:p-6 sm:p-8 md:p-10",
        side === "left" && [
          "inset-y-0 left-0 border border-border border-l-0",
          "w-[85%] xs:w-[80%] sm:w-[70%] max-w-[400px] sm:max-w-[600px] md:max-w-[880px]",
          "rounded-r-[24px] xs:rounded-r-[32px] sm:rounded-r-[40px] md:rounded-r-[48px]",
          "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left"
        ],
        side === "right" && [
          "inset-y-0 right-0 border border-border border-r-0",
          "w-[85%] xs:w-[80%] sm:w-[70%] max-w-[400px] sm:max-w-[600px] md:max-w-[880px]",
          "rounded-l-[24px] xs:rounded-l-[32px] sm:rounded-l-[40px] md:rounded-l-[48px]",
          "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
        ],
        side === "bottom" && [
          "inset-x-0 bottom-0 top-auto w-full border border-border border-b-0",
          "rounded-t-[24px] xs:rounded-t-[28px] sm:rounded-t-[32px]",
          "max-h-[85dvh]",
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
        ],
        side === "top" && [
          "inset-x-0 top-0 bottom-auto w-full border border-border border-t-0",
          "rounded-b-[24px] xs:rounded-b-[28px] sm:rounded-b-[32px]",
          "max-h-[85dvh]",
          "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top"
        ],
        className
      )}
      {...props}
    >
      {children}
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mb-6 flex flex-col gap-2", className)} {...props} />
);

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description ref={ref} className={cn("text-sm text-muted", className)} {...props} />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
};
