import { Spin, message } from "antd";
import React, { useEffect, useState } from "react";
import { FaArrowRight, FaBookOpen, FaCheckCircle, FaClock, FaPlay, FaRocket, FaTrophy, FaUsers } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import HOC from "../../Components/HOC/HOC";
import { useUser } from "../../Context/UserContext";
import NavbarLanding from "../Landing Page/NavbarLanding";

const FreeTest = () => {
  const navigate = useNavigate();
  const [freeTests, setFreeTests] = useState([]);
  const [loading, setLoading] = useState(true);

  const features = [
    {
      icon: <FaClock className="text-3xl" />,
      title: "Timed Practice",
      description: "Experience real exam conditions with time-bound tests",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <FaCheckCircle className="text-3xl" />,
      title: "Instant Results",
      description: "Get detailed analysis and feedback immediately",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <FaTrophy className="text-3xl" />,
      title: "Performance Tracking",
      description: "Monitor your progress and improvement over time",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: <FaBookOpen className="text-3xl" />,
      title: "Comprehensive Coverage",
      description: "Questions covering all important topics and concepts",
      color: "from-purple-500 to-pink-500"
    }
  ];

  // Fetch free tests from backend
  useEffect(() => {
    const fetchFreeTests = async () => {
      try {
        setLoading(true);
        console.log("Fetching free tests from API...");
        const response = await api.get("/free-tests");
        console.log("Free tests response:", response.data);
        if (response.data && response.data.success && response.data.tests) {
          setFreeTests(response.data.tests);
        } else {
          console.warn("No tests found or invalid response format:", response.data);
          setFreeTests([]);
        }
      } catch (error) {
        console.error("Error fetching free tests:", error);
        console.error("Error details:", {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          baseURL: error.config?.baseURL
        });
        message.error(
          error.response?.status === 404
            ? "Free tests endpoint not found. Please contact support."
            : "Failed to load free tests. Please try again later."
        );
        setFreeTests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFreeTests();
  }, []);

  // Format duration helper
  const formatDuration = (duration) => {
    if (!duration) return "N/A";
    const hours = duration.hours || 0;
    const minutes = duration.minutes || 0;
    if (hours > 0 && minutes > 0) {
      return `${hours} hr ${minutes} min`;
    } else if (hours > 0) {
      return `${hours} hr`;
    } else if (minutes > 0) {
      return `${minutes} min`;
    }
    return "N/A";
  };

  // Handle test click
  const handleTakeTest = (testId) => {
    navigate(`/free-test/${testId}`);
  };

  return (
    <div className="min-h-screen font-apple" style={{ background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #f0f0f0 100%)' }}>
      {/* Hero Section */}
      <div className="relative pt-2 pb-4 mt-2 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23023d50' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center animate-apple-slide-up">
          <div className="inline-flex items-center gap-3 glass-apple-light rounded-apple px-6 py-3 border border-brand-primary/20 mb-6">
            <FaRocket className="text-brand-accent text-lg" />
            <span className="text-brand-primary font-semibold">Test Your Knowledge</span>
          </div>

          <h1 className="app-title text-brand-primary mb-6 font-apple">
            Free <span className="text-brand-accent">Practice Tests</span>
          </h1>
          <div className="w-24 h-1 gradient-apple-accent mx-auto mb-6 rounded-full"></div>
          <p className="app-body text-apple-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Prepare for your exams with our comprehensive free practice tests.
            Experience real exam conditions and boost your confidence before the actual test.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="btn-apple-primary px-8 py-4 font-semibold hover-lift shadow-apple flex items-center justify-center gap-3"
            >
              <FaPlay className="text-lg" />
              Start Free Test
            </button>
            <button
              onClick={() => navigate('/explorecourses')}
              className="btn-apple-secondary px-8 py-4 font-semibold hover-lift shadow-apple flex items-center justify-center gap-3"
            >
              <FaBookOpen className="text-lg" />
              Explore Courses
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-6">

        {/* Available Tests Section */}
        <div className="compact-section">
          <div className="text-center compact-container">
            <h2 className="app-subtitle text-brand-primary mb-2 font-apple">
              Available <span className="text-brand-accent">Practice Tests</span>
            </h2>
            <div className="w-12 h-1 gradient-apple-accent mx-auto mb-3 rounded-full"></div>
            <p className="app-body text-apple-gray-600 max-w-2xl mx-auto">
              Choose from our wide range of practice tests tailored for different competitive exams.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spin size="large" />
            </div>
          ) : freeTests.length === 0 ? (
            <div className="text-center py-12">
              <p className="app-body text-apple-gray-600">
                No free tests available at the moment. Please check back later.
              </p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-4">
              {freeTests.map((test) => {
                // Determine background color based on category
                const getBgColor = (category) => {
                  const categoryLower = (category || "").toLowerCase();
                  if (categoryLower.includes("neet") || categoryLower.includes("medical")) {
                    return "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200";
                  } else if (categoryLower.includes("jee") || categoryLower.includes("engineering")) {
                    return "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200";
                  } else if (categoryLower.includes("foundation") || categoryLower.includes("basic")) {
                    return "bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200";
                  }
                  return "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200";
                };

                const bgClasses = getBgColor(test.category);

                return (
                  <div key={test._id} className={`${bgClasses.split(" ")[0]} card-apple compact-container border-2 ${bgClasses.split(" ")[1]} hover-lift transition-all duration-300 ease-apple`}>
                    <div className="mb-4">
                      <h3 className="app-caption font-bold text-brand-primary mb-2 font-apple">{test.quizName}</h3>
                      <div className="flex flex-wrap gap-1 mb-3">
                        <span className="bg-white/80 text-brand-primary px-2 py-1 rounded-apple app-small font-medium">
                          {test.category}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="app-small text-apple-gray-600 font-medium">Duration:</span>
                        <span className="app-small text-brand-primary font-semibold">{formatDuration(test.duration)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="app-small text-apple-gray-600 font-medium">Questions:</span>
                        <span className="app-small text-brand-primary font-semibold">{test.questionCount || 0} Questions</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="app-small text-apple-gray-600 font-medium">Total Marks:</span>
                        <span className="app-small text-brand-primary font-semibold">{test.quizTotalMarks || 0} Marks</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTakeTest(test._id)}
                      className="w-full btn-apple-primary py-2 px-4 app-caption font-semibold hover-lift shadow-apple flex items-center justify-center gap-2"
                    >
                      <FaArrowRight className="text-lg" />
                      Take Test
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="compact-section">
          <div className="text-center compact-container">
            <h2 className="app-subtitle text-brand-primary mb-2 font-apple">
              Why Choose Our <span className="text-brand-accent">Free Tests?</span>
            </h2>
            <div className="w-12 h-1 gradient-apple-accent mx-auto mb-3 rounded-full"></div>
            <p className="app-body text-apple-gray-600 max-w-2xl mx-auto">
              Our practice tests are designed to give you the most realistic exam experience possible.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="card-apple-interactive compact-container text-center">
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-apple-lg flex items-center justify-center mx-auto mb-4 text-white shadow-apple`}>
                  {feature.icon}
                </div>
                <h3 className="app-caption font-bold text-brand-primary mb-2 font-apple">{feature.title}</h3>
                <p className="app-small text-apple-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="gradient-apple-primary rounded-apple-xl compact-container text-white text-center shadow-apple">
          <h2 className="app-subtitle text-white mb-4 font-apple">
            Join Thousands of <span className="text-brand-accent">Successful Students</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="glass-apple-light rounded-apple-lg compact-container">
              <div className="app-body font-bold text-brand-accent mb-1">50,000+</div>
              <div className="app-small text-apple-blue-100">Tests Taken</div>
            </div>
            <div className="glass-apple-light rounded-apple-lg compact-container">
              <div className="app-body font-bold text-brand-accent mb-1">15,000+</div>
              <div className="app-small text-apple-blue-100">Active Students</div>
            </div>
            <div className="glass-apple-light rounded-apple-lg compact-container">
              <div className="app-body font-bold text-brand-accent mb-1">95%</div>
              <div className="app-small text-apple-blue-100">Success Rate</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="compact-section text-center">
          <div className="card-apple compact-container shadow-apple">
            <h2 className="app-subtitle text-brand-primary mb-3 font-apple">
              Ready to Test Your <span className="text-brand-accent">Knowledge?</span>
            </h2>
            <p className="app-body text-apple-gray-600 mb-4 max-w-2xl mx-auto">
              Start your free practice test today and take the first step towards exam success.
              No registration required for basic tests!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/login')}
                className="btn-apple-primary px-6 py-3 app-caption font-semibold hover-lift shadow-apple flex items-center justify-center gap-2"
              >
                <FaRocket className="text-sm" />
                Start Your Journey
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="btn-apple-secondary px-6 py-3 app-caption font-semibold hover-lift shadow-apple flex items-center justify-center gap-2"
              >
                <FaUsers className="text-sm" />
                Get Guidance
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FreeTestWithHOC = HOC(FreeTest);

const ConditionalHOC = () => {
  const { isAuthenticated } = useUser();

  if (isAuthenticated) {
    return <FreeTestWithHOC />;
  } else {
    return (
      <div>
        <NavbarLanding />
        <FreeTest />
      </div>
    );
  }
};

export default ConditionalHOC;
