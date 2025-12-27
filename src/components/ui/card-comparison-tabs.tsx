"use client";

import { useState, useEffect, useRef } from "react";
import { Tabs } from "@/components/ui/tabs";
import Image from "next/image";

export default function CardComparisonTabs() {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const tabs = [
    {
      title: "Traditional Card",
      value: "traditional",
      content: (
        <div className="w-full overflow-hidden relative h-full rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
          <Image
            src="/traditional-card-optimized.webp"
            alt="Traditional business card"
            width={1000}
            height={1000}
            className="object-cover object-center h-full w-full rounded-2xl"
            priority
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
            <p className="text-white text-lg font-semibold">Carte Traditionnelle</p>
            <p className="text-white/80 text-sm">Classique et obsolète</p>
          </div>
        </div>
      ),
    },
    {
      title: "QR Code Card",
      value: "qrcode",
      content: (
        <div className="w-full overflow-hidden relative h-full rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-200 dark:from-blue-900 dark:to-cyan-900">
          <Image
            src="/smartlink-qr-card-optimized.webp"
            alt="SmartLink QR Code card"
            width={1000}
            height={1000}
            className="object-cover object-center h-full w-full rounded-2xl"
            priority
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
            <p className="text-white text-lg font-semibold">Carte SmartLink QR</p>
            <p className="text-white/80 text-sm">Moderne et interactif</p>
          </div>
        </div>
      ),
    },
  ];

  // Auto-switch every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % tabs.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [tabs.length]);

  // Handle touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      touchStartX.current = touch.clientX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      touchEndX.current = touch.clientX;
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      // Swipe left
      setActiveIndex((prev) => (prev + 1) % tabs.length);
    }

    if (touchStartX.current - touchEndX.current < -50) {
      // Swipe right
      setActiveIndex((prev) => (prev - 1 + tabs.length) % tabs.length);
    }
  };

  // Keep tabs synced with activeIndex
  useEffect(() => {
    const event = new CustomEvent('switchTab', { detail: { index: activeIndex } });
    window.dispatchEvent(event);
  }, [activeIndex]);

  return (
    <div 
      className="h-[20rem] md:h-[35rem] [perspective:1000px] relative flex flex-col max-w-5xl mx-auto w-full items-start justify-start"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Tabs 
        tabs={tabs}
        containerClassName="mb-8 justify-center w-full"
        tabClassName="flex-1 text-center min-w-[150px]"
        activeTabClassName="bg-primary"
        contentClassName="mt-8"
      />
    </div>
  );
}
