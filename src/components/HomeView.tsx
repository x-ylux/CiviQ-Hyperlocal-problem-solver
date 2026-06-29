import React from "react";
import { Leaf, Award, Users, Shield, Zap } from "lucide-react";
import { motion } from "motion/react";

interface HomeViewProps {
  onNavigate: (tab: string) => void;
  credits: number;
}

export function HomeView({ onNavigate, credits }: HomeViewProps) {
  return (
    <div className="relative overflow-hidden min-h-screen bg-[#F9FBF7] text-[#1D3B1F] py-12 px-6">
      {/* Background soft ambient blobs */}
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-lime-100/40 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left column: High impact BonLeaf-inspired Typography */}
        <div className="lg:col-span-6 space-y-8 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-semibold"
          >
            <Leaf className="w-3.5 h-3.5 text-emerald-600 animate-spin-slow" />
            <span>AI-POWERED CIVIC EMPOWERMENT</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-none text-[#122E15]"
          >
            GROW GREEN <br />
            <span className="text-emerald-600">LIVE BETTER</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg text-emerald-900/80 max-w-lg leading-relaxed font-light"
          >
            CiviQ is a sustainable community platform enabling real-time issue tracking, AI-powered automated categorization, and intelligent carbon footprint offsets.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            <button
              onClick={() => onNavigate("reports")}
              className="px-8 py-4 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm transition-all duration-300 transform hover:-translate-y-1 shadow-lg shadow-emerald-950/20 flex items-center gap-2"
            >
              Discover More <span>→</span>
            </button>
            <button
              onClick={() => onNavigate("carbon")}
              className="px-8 py-4 rounded-full border border-emerald-800/30 hover:bg-emerald-50 text-emerald-800 font-semibold text-sm transition-all duration-300"
            >
              Carbon Calculator
            </button>
          </motion.div>

          {/* Core Stats widget (crawling stats) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="pt-6 grid grid-cols-3 gap-6 border-t border-emerald-900/10"
          >
            <div>
              <div className="text-3xl font-extrabold text-emerald-900">8.3K+</div>
              <div className="text-xs text-emerald-800/60 uppercase tracking-widest mt-1">Active Citizens</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-emerald-900">1.2K+</div>
              <div className="text-xs text-emerald-800/60 uppercase tracking-widest mt-1">Resolved Issues</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[#F97316]">94.8%</div>
              <div className="text-xs text-emerald-800/60 uppercase tracking-widest mt-1">AI Accuracy</div>
            </div>
          </motion.div>
        </div>

        {/* Right column: Seedling cradled in hand with dotted circular growth halo */}
        <div className="lg:col-span-6 relative flex justify-center items-center">
          {/* Circular dotted halo (rotating animation) */}
          <div className="absolute w-[28rem] h-[28rem] border-2 border-dashed border-emerald-800/20 rounded-full animate-spin-slow flex items-center justify-center">
            {/* Soft decorative dots on circle */}
            <div className="absolute -top-1 w-3 h-3 rounded-full bg-emerald-600" />
            <div className="absolute -bottom-1 w-3 h-3 rounded-full bg-emerald-600" />
            <div className="absolute -left-1 w-3 h-3 rounded-full bg-emerald-600" />
            <div className="absolute -right-1 w-3 h-3 rounded-full bg-emerald-600" />
          </div>

          {/* Secondary halo */}
          <div className="absolute w-[24rem] h-[24rem] border border-emerald-800/10 rounded-full" />

          {/* Main Visual Image Card with subtle overlays */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1 }}
            className="relative z-10 w-96 h-96 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white bg-white flex items-center justify-center group"
          >
            <img
              src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=600&auto=format&fit=crop"
              alt="Cradled seedling indicating environmental care"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            {/* Soft visual overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/20 to-transparent" />
          </motion.div>

          {/* Visual Floating Widget 1: Quality You Can Trust (from original image style) */}
          <motion.div
            initial={{ x: -50, y: 50, opacity: 0 }}
            animate={{ x: -20, y: 100, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="absolute left-0 bottom-0 z-20 bg-white p-4 rounded-2xl shadow-xl border border-emerald-50 max-w-[200px]"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="bg-emerald-50 p-1.5 rounded-lg">
                <Shield className="w-4 h-4 text-emerald-700" />
              </div>
              <span className="text-xs font-bold text-emerald-950">Verified Security</span>
            </div>
            <p className="text-[10px] text-emerald-800/60 leading-normal">
              100% encrypted profile and immutable audit logs.
            </p>
          </motion.div>

          {/* Visual Floating Widget 2: 120K+ Happy Customers (forest green tag from BonLeaf) */}
          <motion.div
            initial={{ x: 50, y: -50, opacity: 0 }}
            animate={{ x: 20, y: -120, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="absolute right-0 top-0 z-20 bg-[#1D3B1F] text-[#EEF5E9] p-5 rounded-2xl shadow-xl min-w-[180px] space-y-2"
          >
            <div className="flex -space-x-2 overflow-hidden">
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#1D3B1F] bg-emerald-500 flex items-center justify-center text-[8px] font-bold">PM</div>
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#1D3B1F] bg-emerald-600 flex items-center justify-center text-[8px] font-bold">RK</div>
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#1D3B1F] bg-emerald-700 flex items-center justify-center text-[8px] font-bold">AS</div>
            </div>
            <div>
              <div className="text-lg font-bold">Active Community</div>
              <div className="text-[10px] opacity-70">Redeemed {credits} XP credits</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Sustainable Principles Section */}
      <div className="max-w-7xl mx-auto mt-24 border-t border-emerald-900/10 pt-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
          <div className="inline-block bg-emerald-50 border border-emerald-200/50 text-emerald-800 px-3.5 py-1 rounded-full text-xs font-semibold">
            THE 3R PRINCIPLE
          </div>
          <h2 className="text-3xl font-extrabold text-emerald-950">Our Sustainable Core</h2>
          <p className="text-sm text-emerald-800/70 font-light">
            CiviQ integrates the pillars of Reduce, Reuse, and Recycle directly into local community actions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-emerald-700 font-bold text-xl">1</div>
            <h3 className="text-lg font-bold text-emerald-950 mb-3">Reduce Carbon</h3>
            <p className="text-sm text-emerald-800/70 leading-relaxed font-light">
              Log daily energy, garbage, and travel metrics. Our AI analyzes your pattern and structures a detailed plan.
            </p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-emerald-700 font-bold text-xl">2</div>
            <h3 className="text-lg font-bold text-emerald-950 mb-3">Reuse Resources</h3>
            <p className="text-sm text-emerald-800/70 leading-relaxed font-light">
              Report public service breakdowns. Merging duplicate reports prevents resource waste by dispatching single maintenance units.
            </p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-emerald-700 font-bold text-xl">3</div>
            <h3 className="text-lg font-bold text-emerald-950 mb-3">Recycle & Reward</h3>
            <p className="text-sm text-emerald-800/70 leading-relaxed font-light">
              Redeem gained XP for real municipal rewards like public transit passes and green home compost kits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
