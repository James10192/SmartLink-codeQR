"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"
import * as RadioPrimitive from "@base-ui/react/radio"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive
      className={cn("grid gap-3", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof RadioPrimitive.Radio.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioPrimitive.Radio.Root
      ref={ref}
      className={cn(
        "group aspect-square h-4 w-4 rounded-full border border-primary text-primary outline-none ring-offset-background",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        className
      )}
      {...props}
    >
      <RadioPrimitive.Radio.Indicator
        className={cn(
          "flex items-center justify-center",
          "text-current"
        )}
      >
        <Circle className="h-2.5 w-2.5 fill-current" />
      </RadioPrimitive.Radio.Indicator>
    </RadioPrimitive.Radio.Root>
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
