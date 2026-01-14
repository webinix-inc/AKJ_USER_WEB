import React from "react";
import {
  FaArrowRight,
  FaGraduationCap,
  FaUsers,
  FaTrophy,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ImportantLinkSection from "./ImportantLinkSection";

const UnlockYourPotential = () => {
  const navigate = useNavigate();

  return (
    <div className="relative bg-gradient-to-br from-white to-apple-gray-50 overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23023d50' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        ></div>
      </div>

      <div className="relative z-10 w-full px-6 compact-hero">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Text Content */}
          <div className="text-apple-gray-800 space-apple-sm">
            <div className="space-apple-sm">
              <div className="inline-flex items-center gap-2 glass-apple-light rounded-apple px-4 py-2 border border-brand-primary/20">
                <div className="w-2 h-2 gradient-apple-accent rounded-full animate-apple-pulse"></div>
                <span className="app-caption font-medium text-brand-primary font-apple">
                  🎓 Since 1974 - Sign of Success
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight font-apple">
                <span className="block text-brand-primary">Unlock Your</span>
                <span className="block text-brand-accent">Potential</span>
              </h1>

              <p className="app-body text-apple-gray-600 leading-relaxed max-w-2xl font-apple">
                Transform your future with expert-designed courses. Master every
                concept, ace every exam, and achieve your dreams with
                confidence.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/register")}
                className="btn-apple-primary px-6 py-3  font-semibold hover-lift shadow-apple flex items-center justify-center gap-2 group "
              >
                Start Learning Today
                <FaArrowRight className="text-sm group-hover:translate-x-1 transition-transform duration-300 ease-apple" />
              </button>
              <button
                onClick={() => navigate("/explorecourses")}
                className="btn-apple-secondary px-6 py-3 app-caption font-semibold hover-lift shadow-apple"
              >
                Explore Courses
              </button>
            </div>

            {/* Stats with compact design */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center group">
                <div className="relative mb-2">
                  <div className="w-10 h-10 mx-auto gradient-apple-primary rounded-apple-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 ease-apple shadow-apple">
                    <FaUsers className="text-sm text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 gradient-apple-accent rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">+</span>
                  </div>
                </div>
                <div className="app-caption font-bold text-brand-primary font-apple">
                  10K+
                </div>
                <div className="app-small text-apple-gray-600 font-medium">
                  Happy Students
                </div>
              </div>
              <div className="text-center group">
                <div className="relative mb-2">
                  <div className="w-10 h-10 mx-auto gradient-apple-accent rounded-apple-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 ease-apple shadow-apple">
                    <FaGraduationCap className="text-sm text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 gradient-apple-primary rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">★</span>
                  </div>
                </div>
                <div className="app-caption font-bold text-brand-primary font-apple">
                  50+
                </div>
                <div className="app-small text-apple-gray-600 font-medium">
                  Expert Courses
                </div>
              </div>
              <div className="text-center group">
                <div className="relative mb-2">
                  <div className="w-10 h-10 mx-auto gradient-apple-primary rounded-apple-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 ease-apple shadow-apple">
                    <FaTrophy className="text-sm text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 gradient-apple-accent rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">✓</span>
                  </div>
                </div>
                <div className="app-caption font-bold text-brand-primary font-apple">
                  95%
                </div>
                <div className="app-small text-apple-gray-600 font-medium">
                  Success Rate
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Section - Clean Design */}
          <div className="relative">
            <div className="relative card-apple compact-container shadow-apple">
              <div className="absolute -top-2 -left-2 w-4 h-4 gradient-apple-accent rounded-apple rotate-45"></div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 gradient-apple-primary rounded-apple rotate-12"></div>
              <ImportantLinkSection />
            </div>

            {/* Clean Floating Elements */}
            <div className="absolute -top-3 right-3 w-8 h-8 gradient-apple-accent rounded-full flex items-center justify-center shadow-apple animate-apple-bounce">
              <span className="text-sm">🚀</span>
            </div>
            <div className="absolute top-1/2 -left-2 w-2 h-2 bg-brand-primary rounded-full animate-apple-pulse opacity-60"></div>
            <div className="absolute bottom-3 left-1 w-1.5 h-1.5 bg-brand-accent rounded-full animate-apple-ping opacity-50"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnlockYourPotential;
