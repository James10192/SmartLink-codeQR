"use client";
import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";
import { Check } from "lucide-react";

export const Icon = ({ className, ...rest }: any) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
};

const PlanIcon = () => {
  return (
    <svg
      width="66"
      height="65"
      viewBox="0 0 66 65"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-10 w-10 text-black dark:text-white group-hover/canvas-card:text-white "
    >
      <path
        d="M8 8.05571C8 8.05571 54.9009 18.1782 57.8687 30.062C60.8365 41.9458 9.05432 57.4696 9.05432 57.4696"
        stroke="currentColor"
        strokeWidth="15"
        strokeMiterlimit="3.86874"
        strokeLinecap="round"
        style={{ mixBlendMode: "darken" }}
      />
    </svg>
  );
};

interface CardProps {
  title: string;
  price: string;
  period?: string;
  features: string[];
  colors: number[][];
  animationSpeed?: number;
  onButtonClick: () => void;
  isPopular?: boolean;
}

const Card = ({
  title,
  price,
  period,
  features,
  colors,
  animationSpeed = 3,
  onButtonClick,
  isPopular = false,
}: CardProps) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="border border-black/[0.2] group/canvas-card flex items-center justify-center dark:border-white/[0.2] max-w-sm w-full mx-auto p-4 relative h-[30rem]"
    >
      <Icon className="absolute h-6 w-6 -top-3 -left-3 dark:text-white text-black" />
      <Icon className="absolute h-6 w-6 -bottom-3 -left-3 dark:text-white text-black" />
      <Icon className="absolute h-6 w-6 -top-3 -right-3 dark:text-white text-black" />
      <Icon className="absolute h-6 w-6 -bottom-3 -right-3 dark:text-white text-black" />

      {isPopular && (
        <div className="absolute top-2 right-2 z-30">
          <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            Le plus populaire
          </span>
        </div>
      )}

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full w-full absolute inset-0"
          >
            <CanvasRevealEffect
              animationSpeed={animationSpeed}
              containerClassName="bg-black"
              colors={colors}
              dotSize={2}
            />
            <div className="absolute inset-0 [mask-image:radial-gradient(400px_at_center,white,transparent)] bg-black/50 dark:bg-black/90" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-20 w-full px-4">
        <div className="text-center group-hover/canvas-card:-translate-y-4 group-hover/canvas-card:opacity-0 transition duration-200 w-full mx-auto flex items-center justify-center">
          <PlanIcon />
        </div>
        <div className="opacity-0 group-hover/canvas-card:opacity-100 relative z-10 transition duration-200 w-full">
          <h2 className="dark:text-white text-center text-3xl font-bold text-white mb-2">
            {title}
          </h2>
          <div className="text-center mb-6">
            <span className="text-4xl font-bold text-white">{price}</span>
            {period && <span className="text-white/60 text-sm ml-1">{period}</span>}
          </div>
          <div className="space-y-2 mb-6">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2 text-left">
                <Check className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-white/90">{feature}</span>
              </div>
            ))}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onButtonClick();
            }}
            className="w-full px-8 py-3 rounded-lg bg-white text-black font-semibold hover:bg-white/90 transition-colors"
          >
            Choisir
          </button>
        </div>
      </div>
    </div>
  );
};

interface PricingCanvasCardsProps {
  plans: CardProps[];
}

export default function PricingCanvasCards({ plans }: PricingCanvasCardsProps) {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-center bg-black w-full gap-4 mx-auto px-8">
      {plans.map((plan, index) => (
        <Card key={index} {...plan} />
      ))}
    </div>
  );
}
