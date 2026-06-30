import React, { useState } from "react";

export default function CiviQAIShowcase() {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: "How AI Solves Community Challenges",
      subtitle: "Transforming civic engagement through intelligent automation",
      icon: "fa-robot",
      color: "bg-emerald-600",
      content: (
        <div className="space-y-6">
          <p className="text-lg md:text-xl text-emerald-700 ">
            Local governments and communities often face bottlenecks in reporting, verifying, and resolving public issues. Our AI-driven solution eliminates these frictions.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {["Reporting", "Verification", "Tracking", "Resolution"].map((step, i) => (
              <div key={i} className="bg-emerald-50  p-4 rounded-xl border border-emerald-200  text-center shadow-sm">
                <div className="w-10 h-10 mx-auto bg-emerald-100  text-emerald-600  rounded-full flex items-center justify-center font-bold mb-3">
                  {i + 1}
                </div>
                <h4 className="font-bold text-emerald-900 ">{step}</h4>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "1. Intelligent Reporting",
      subtitle: "Removing friction from the citizen experience",
      icon: "fa-bullhorn",
      color: "bg-blue-600",
      content: (
        <div className="space-y-6">
          <p className="text-emerald-700 ">
            Traditionally, citizens struggle with complex forms and category selection. AI streamlines this:
          </p>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="mt-1 text-blue-500"><i className="fas fa-camera"></i></div>
              <div>
                <strong className="block text-emerald-900 ">Computer Vision Categorization</strong>
                <span className="text-sm text-emerald-600 ">Citizens simply snap a photo. The AI automatically detects the issue (e.g., "Pothole", "Broken Streetlight") and pre-fills the category.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 text-blue-500"><i className="fas fa-microphone"></i></div>
              <div>
                <strong className="block text-emerald-900 ">Multilingual Voice-to-Text</strong>
                <span className="text-sm text-emerald-600 ">Users can describe the issue in their native language. AI transcribes, translates, and structures the report automatically.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 text-blue-500"><i className="fas fa-magic"></i></div>
              <div>
                <strong className="block text-emerald-900 ">Smart Description Generation</strong>
                <span className="text-sm text-emerald-600 ">AI drafts a professional summary based on the image and keywords, saving time.</span>
              </div>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: "2. Automated Verification",
      subtitle: "Ensuring data quality and preventing spam",
      icon: "fa-check-double",
      color: "bg-amber-500",
      content: (
        <div className="space-y-6">
          <p className="text-emerald-700 ">
            Authorities waste time on duplicate or fake reports. AI acts as a smart filter:
          </p>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="mt-1 text-amber-500"><i className="fas fa-clone"></i></div>
              <div>
                <strong className="block text-emerald-900 ">Duplicate Detection</strong>
                <span className="text-sm text-emerald-600 ">Cross-references incoming images and GPS coordinates with existing open tickets to flag duplicates instantly.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 text-amber-500"><i className="fas fa-shield-alt"></i></div>
              <div>
                <strong className="block text-emerald-900 ">Authenticity Scoring</strong>
                <span className="text-sm text-emerald-600 ">Analyzes EXIF data and image consistency to ensure the photo is a real, live capture of an actual issue.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 text-amber-500"><i className="fas fa-exclamation-triangle"></i></div>
              <div>
                <strong className="block text-emerald-900 ">Severity Assessment</strong>
                <span className="text-sm text-emerald-600 ">AI evaluates the image to assign an initial risk or urgency score (e.g., deep sinkhole = Critical).</span>
              </div>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: "3. Proactive Tracking",
      subtitle: "Keeping citizens informed & authorities prepared",
      icon: "fa-satellite-dish",
      color: "bg-purple-600",
      content: (
        <div className="space-y-6">
          <p className="text-emerald-700 ">
            Citizens need transparency, and authorities need to prioritize effectively.
          </p>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="mt-1 text-purple-500"><i className="fas fa-chart-line"></i></div>
              <div>
                <strong className="block text-emerald-900 ">Escalation Risk Prediction</strong>
                <span className="text-sm text-emerald-600 ">AI predicts which issues might worsen (e.g., a small leak turning into a flood based on weather forecasts).</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 text-purple-500"><i className="fas fa-bell"></i></div>
              <div>
                <strong className="block text-emerald-900 ">Smart Notifications</strong>
                <span className="text-sm text-emerald-600 ">Automatically sends citizens status updates translated into simple, non-bureaucratic language.</span>
              </div>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: "4. Efficient Resolution",
      subtitle: "Optimizing municipal workflows",
      icon: "fa-tools",
      color: "bg-rose-600",
      content: (
        <div className="space-y-6">
          <p className="text-emerald-700 ">
            Resolving issues faster requires optimal resource allocation.
          </p>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="mt-1 text-rose-500"><i className="fas fa-network-wired"></i></div>
              <div>
                <strong className="block text-emerald-900 ">Automated Dispatch & Routing</strong>
                <span className="text-sm text-emerald-600 ">AI automatically routes tickets to the correct department (Water, Roads, Power) based on the AI-verified category.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 text-rose-500"><i className="fas fa-file-contract"></i></div>
              <div>
                <strong className="block text-emerald-900 ">Smart Contractor Briefings</strong>
                <span className="text-sm text-emerald-600 ">Generates precise work orders, materials lists, and hazard warnings for field workers before they arrive.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 text-rose-500"><i className="fas fa-chart-pie"></i></div>
              <div>
                <strong className="block text-emerald-900 ">Macro Insights</strong>
                <span className="text-sm text-emerald-600 ">Aggregates city-wide data to help planners identify systemic issues (e.g., recurring water leaks in a specific ward).</span>
              </div>
            </li>
          </ul>
        </div>
      )
    }
  ];

  const currentSlide = slides[activeSlide];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-[80vh] flex flex-col">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold text-emerald-900  tracking-tight">AI Solution Architecture</h2>
        <p className="text-emerald-600  mt-2">Presentation Guide for Stakeholders</p>
      </div>

      <div className="flex-1 bg-white  rounded-3xl shadow-xl border border-emerald-200  overflow-hidden flex flex-col md:flex-row">
        
        {/* Sidebar / Progress */}
        <div className="md:w-1/3 bg-emerald-50  p-6 border-b md:border-b-0 md:border-r border-emerald-200 ">
          <div className="space-y-3">
            {slides.map((slide, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-300 flex items-center gap-4 ${
                  activeSlide === idx 
                    ? "bg-white  shadow-md border border-emerald-200  scale-[1.02]" 
                    : "hover:bg-emerald-200 :bg-emerald-800 text-emerald-600 "
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${slide.color} ${activeSlide === idx ? 'shadow-lg shadow-' + slide.color.split('-')[1] + '-500/30' : 'opacity-70'}`}>
                  <i className={`fas ${slide.icon}`}></i>
                </div>
                <div className="flex-1">
                  <span className={`block font-bold text-sm ${activeSlide === idx ? 'text-emerald-900 ' : ''}`}>
                    {slide.title}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Slide Content */}
        <div className="flex-1 p-8 md:p-12 relative flex flex-col justify-center">
          <div className="absolute top-8 right-8 text-emerald-200  text-6xl opacity-30 pointer-events-none">
            <i className={`fas ${currentSlide.icon}`}></i>
          </div>
          
          <div className="relative z-10">
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-4 ${currentSlide.color}`}>
              Slide {activeSlide + 1} of {slides.length}
            </div>
            
            <h3 className="text-3xl md:text-4xl font-extrabold text-emerald-900  mb-2 leading-tight">
              {currentSlide.title}
            </h3>
            <p className="text-lg text-emerald-500  mb-8 font-medium">
              {currentSlide.subtitle}
            </p>
            
            <div className="prose  max-w-none">
              {currentSlide.content}
            </div>
          </div>
          
          <div className="mt-12 flex items-center justify-between pt-6 border-t border-emerald-100 ">
            <button 
              onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
              disabled={activeSlide === 0}
              className={`px-6 py-2 rounded-full font-bold text-sm transition-colors ${activeSlide === 0 ? 'bg-emerald-100  text-emerald-400 cursor-not-allowed' : 'bg-emerald-200  hover:bg-emerald-300 :bg-emerald-600 text-emerald-700 '}`}
            >
              Previous
            </button>
            <button 
              onClick={() => setActiveSlide(Math.min(slides.length - 1, activeSlide + 1))}
              disabled={activeSlide === slides.length - 1}
              className={`px-6 py-2 rounded-full font-bold text-sm transition-colors ${activeSlide === slides.length - 1 ? 'bg-emerald-100  text-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20'}`}
            >
              Next Slide
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
