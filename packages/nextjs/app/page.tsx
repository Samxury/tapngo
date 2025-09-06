"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
//import { useRouter } from "next/navigation";
import CustomLayout from "~~/components/CustomLayout";
import PersistentDownArrow from "~~/components/PersistentDownArrow";
import DemoSection from "~~/components/sections/DemoSection";
import FeaturesSection from "~~/components/sections/FeaturesSection";
import HowItWorksSection from "~~/components/sections/HowItWorks";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  //  const router = useRouter();

  useEffect(() => {
    const playVideo = () => {
      if (videoRef.current) {
        videoRef.current.play().catch(error => {
          console.error("Video play failed:", error);
        });
      }
    };
    playVideo();
    const timer = setTimeout(playVideo, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative">
      {/* Video Background - FIXED POSITION with low z-index */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="fixed top-0 left-0 w-full h-full object-cover z-0"
        src="/hero-bg.mp4"
        poster="/thumbnail.jpg"
      />

      {/* Enhanced Gradient Overlay - Darker for better contrast */}
      <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-b from-black/40 via-black/20 to-black/40 z-1"></div>

      <CustomLayout>
        {/* Hero Section */}
        <div className="relative h-screen overflow-hidden">
          {/* Hero Content with Glassmorphic Design */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center p-8">
            {/* Logo with TRANSPARENT background (removed bg classes) */}
            <div className="w-48 h-24 flex items-center justify-center mb-8 drop-shadow-lg">
              <Image src="/app_logo.png" alt="TapNGo Pay" width={250} height={60} className="object-contain" priority />
            </div>

            {/* Main Headline with Glassmorphic Background */}
            <div className="bg-black/25 backdrop-blur-md rounded-2xl p-8 mb-6 border border-white/10">
              <h1 className="text-5xl md:text-7xl font-bold mb-4 text-white drop-shadow-2xl">Tap. Pay. Go.</h1>
            </div>

            {/* Subtitle with Glassmorphic Background */}
            <div className="bg-black/25 backdrop-blur-md rounded-xl p-6 mb-10 border border-white/10 max-w-2xl">
              <p className="text-xl md:text-2xl text-white drop-shadow-xl">The future of payments in Ghana.</p>
            </div>

            {/* Buttons with Glassmorphic Effects */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
              <Link
                href="/sign-up"
                className="bg-blue-600/90 hover:bg-blue-700/90 backdrop-blur-sm text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 drop-shadow-lg border border-blue-400/30 text-center"
              >
                Get Started &rarr;
              </Link>
              <Link
                href="/sign-in"
                className="bg-gray-800/80 hover:bg-gray-900/80 backdrop-blur-sm text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 drop-shadow-lg border border-gray-400/20 text-center"
              >
                Sign In &gt;
              </Link>
            </div>
          </div>
        </div>

        {/* Sections below with their own solid backgrounds */}
        <FeaturesSection />
        <HowItWorksSection />
        <DemoSection />

        {/* Persistent Down Arrow */}
        <PersistentDownArrow />
      </CustomLayout>
    </div>
  );
}
