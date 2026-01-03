'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const BottomSheet = DialogPrimitive.Root
const BottomSheetTrigger = DialogPrimitive.Trigger
const BottomSheetClose = DialogPrimitive.Close
const BottomSheetPortal = DialogPrimitive.Portal

const BottomSheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
))
BottomSheetOverlay.displayName = 'BottomSheetOverlay'

const BottomSheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <BottomSheetPortal>
    <BottomSheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-50 grid w-full gap-4',
        // Mobile: Bottom sheet (slide from bottom, 80vh max)
        'bottom-0 left-0 right-0 rounded-t-2xl',
        'max-h-[80vh] overflow-y-auto',
        // Desktop: Centered dialog
        'lg:left-[50%] lg:top-[50%] lg:bottom-auto lg:right-auto',
        'lg:max-w-lg lg:translate-x-[-50%] lg:translate-y-[-50%]',
        'lg:rounded-lg lg:max-h-[90vh]',
        // Styling
        'border bg-background p-6 shadow-lg',
        // Mobile animations (slide from bottom)
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        // Desktop animations (zoom + slide)
        'lg:data-[state=closed]:slide-out-to-left-1/2 lg:data-[state=closed]:slide-out-to-top-[48%]',
        'lg:data-[state=open]:slide-in-from-left-1/2 lg:data-[state=open]:slide-in-from-top-[48%]',
        'lg:data-[state=closed]:zoom-out-95 lg:data-[state=open]:zoom-in-95',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </BottomSheetPortal>
))
BottomSheetContent.displayName = 'BottomSheetContent'

const BottomSheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
    {...props}
  />
)
BottomSheetHeader.displayName = 'BottomSheetHeader'

const BottomSheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
BottomSheetTitle.displayName = 'BottomSheetTitle'

const BottomSheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
BottomSheetDescription.displayName = 'BottomSheetDescription'

export {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
}
