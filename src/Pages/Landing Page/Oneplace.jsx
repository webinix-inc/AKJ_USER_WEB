import React from "react";
import { FaBook, FaVideo, FaClipboardList, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Oneplace = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FaBook className="text-4xl" />,
      title: "Study Notes",
      description: "Comprehensive study materials designed by experts to help you master every concept with detailed explanations and examples.",
      color: "text-[#0086b2]",
      bgColor: "bg-blue-50",
      borderColor: "border-[#0086b2]"
    },
    {
      icon: <FaClipboardList className="text-4xl" />,
      title: "Test Series",
      description: "Practice with our extensive test series that simulate real exam conditions and help you track your progress effectively.",
      color: "text-[#023d50]",
      bgColor: "bg-slate-50",
      borderColor: "border-[#023d50]"
    },
    {
      icon: <FaVideo className="text-4xl" />,
      title: "Video Lectures",
      description: "Learn from experienced faculty through high-quality video lectures that make complex topics easy to understand.",
      color: "text-[#fc9721]",
      bgColor: "bg-orange-50",
      borderColor: "border-[#fc9721]"
    }
  ];

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="text-center compact-container">
        <h2 className="app-subtitle text-brand-primary mb-2 font-apple">
          Everything You Need for Your <span className="text-brand-accent">Exam</span>
        </h2>
        <div className="w-12 h-1 gradient-apple-accent rounded-full mx-auto mb-3"></div>
        <p className="app-body text-apple-gray-600 max-w-3xl mx-auto leading-relaxed font-apple">
          Study from content highly focused on the syllabus to be 100% exam ready with our comprehensive learning platform
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className={`${feature.bgColor} card-apple compact-container border-2 ${feature.borderColor} hover-lift transition-all duration-300 ease-apple group`}
          >
            <div className={`${feature.color} mb-4 flex justify-center`}>
              <div className="text-2xl">{feature.icon}</div>
            </div>
            <h3 className={`app-caption font-bold ${feature.color} mb-2 text-center font-apple`}>
              {feature.title}
            </h3>
            <p className="app-small text-apple-gray-600 text-center leading-relaxed mb-4">
              {feature.description}
            </p>
            <div className="flex items-center justify-center">
              <button className={`${feature.color} font-semibold flex items-center gap-2 hover:gap-3 transition-all duration-300 ease-apple app-small`}>
                Explore Now
                <FaArrowRight className="text-xs" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Call to Action */}
      <div className="text-center">
        <div className="gradient-apple-primary rounded-apple-xl compact-container">
          <h3 className="app-subtitle font-bold text-white mb-2 font-apple">
            Ready to Start Your Journey?
          </h3>
          <p className="text-apple-blue-100 app-body mb-4 max-w-2xl mx-auto font-apple">
            Join thousands of successful students who have achieved their dreams with our comprehensive learning platform
          </p>
          <button
            onClick={() => navigate("/register")}
            className="btn-apple-accent px-6 py-3 app-caption font-bold hover-lift shadow-apple"
          >
            Join For Free
          </button>
        </div>
      </div>
    </div>
  );
};

export default Oneplace;
