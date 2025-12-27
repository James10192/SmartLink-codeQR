"use client";
import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";
import { Check } from "lucide-react";

interface PricingCardProps {
  planName: string;
  price: string;
  description: string;
  features: string[];
  colors: number[][];
  onButtonClick: () => void;
  isPopular?: boolean;
}

function PricingCanvasCard({
  planName,
  price,
  description,
  features,
  colors,
  onButtonClick,
  isPopular = false,
}: PricingCardProps) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group/canvas-card relative h-[30rem] flex flex-col overflow-hidden items-center justify-center bg-black border border-white/[0.2] w-full mx-auto p-4 cursor-pointer"
    >
      {/* Badge "Le plus populaire" */}
      {isPopular && (
        <div className="absolute top-4 right-4 z-30">
          <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            Le plus populaire
          </span>
        </div>
      )}

      {/* Canvas Reveal Effect au hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full absolute inset-0"
          >
            <CanvasRevealEffect
              animationSpeed={3}
              containerClassName="bg-transparent"
              colors={colors}
              opacities={[0.2, 0.2, 0.2, 0.2, 0.2, 0.4, 0.4, 0.4, 0.4, 1]}
              dotSize={2}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Radial gradient pour l'effet de fade */}
      <div className="absolute inset-0 [mask-image:radial-gradient(400px_at_center,white,transparent)] bg-black/50 dark:bg-black/90" />

      {/* Contenu de la carte */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4">
        {/* Titre du plan (toujours visible) */}
        <motion.h3
          className="text-4xl md:text-5xl font-bold text-white mb-2"
          animate={{
            y: hovered ? -20 : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          {planName}
        </motion.h3>

        {/* Description (toujours visible) */}
        <motion.p
          className="text-sm text-white/60 mb-6"
          animate={{
            opacity: hovered ? 0 : 1,
            y: hovered ? -10 : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          {description}
        </motion.p>

        {/* Prix et Features (apparaissent au hover) */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex flex-col items-center gap-4 w-full"
            >
              {/* Prix */}
              <div className="mb-4">
                <span className="text-5xl md:text-6xl font-bold text-white">
                  {price}
                </span>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-6 w-full max-w-xs">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-left">
                    <Check className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-white/90">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Bouton CTA */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onButtonClick();
                }}
                className="px-8 py-3 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-colors w-full max-w-xs"
              >
                Choisir ce plan
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface PricingCanvasRevealProps {
  plans: PricingCardProps[];
}

export default function PricingCanvasReveal({ plans }: PricingCanvasRevealProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
      {plans.map((plan, index) => (
        <PricingCanvasCard key={index} {...plan} />
      ))}
    </div>
  );
}
