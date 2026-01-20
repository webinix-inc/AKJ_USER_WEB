import React, { useState, useEffect, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import NavbarLanding from "./NavbarLanding";

// Lazy load all below-the-fold components for better initial load performance
const UnlockYourPotential = lazy(() => import("./UnlockYourPotential"));
const Oneplace = lazy(() => import("./Oneplace"));
const Startlearning = lazy(() => import("./Startlearning"));
const Classes = lazy(() => import("./Classes"));
const ClientSay = lazy(() => import("./ClientSay"));
const Footerlanding = lazy(() => import("./Footerlanding"));
const StaticUser = lazy(() => import("./StaticUser"));
const BannerCarousel = lazy(() =>
  import("../../Components/Banners/BannerCarousel")
);

const LandingPage = () => {
  const navigate = useNavigate(); // Fix #3: Use React Router navigation
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(false);

  // Fetch banners for landing page
  const fetchBanners = async () => {
    setBannersLoading(true);
    try {
      // 🔧 FIX: Use consistent API URL structure
      const baseURL =
        process.env.REACT_APP_API_URL ||
        "https://lms-backend-724799456037.europe-west1.run.app/api/v1";
      const apiUrl = `${baseURL}/admin/banner`;

      // Fix #5: Console logs only in development
      if (process.env.NODE_ENV === 'development') {
        console.log("🔍 Fetching banners from:", apiUrl);
      }

      const response = await fetch(apiUrl, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (process.env.NODE_ENV === 'development') {
        console.log("📡 Banner response status:", response.status);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (process.env.NODE_ENV === 'development') {
        console.log("📊 Banner data received:", data);
      }

      if (data.status === 200 && data.data && Array.isArray(data.data)) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Setting ${data.data.length} banners`);
        }
        setBanners(data.data);
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log("⚠️ No banner data found");
        }
        setBanners([]);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("❌ Error fetching banners:", error);
      }
      setBanners([]);
    } finally {
      setBannersLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleBannerClick = (banner) => {
    if (!banner) return;

    // Handle course navigation if banner is associated with a course
    if (banner.course && banner.course._id) {
      // Fix #3: Use React Router navigate instead of window.location.href
      navigate(`/explorecourses/${banner.course._id}`);
      return;
    }

    // Handle external link if provided
    if (banner.externalLink?.trim()) {
      window.open(banner.externalLink.trim(), "_blank", "noopener,noreferrer");
      return;
    }

    // Fix #3: Use React Router navigate for internal navigation
    navigate("/explorecourses");
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden font-apple"
      style={{
        background:
          "linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #f0f0f0 100%)",
      }}
    >
      {/* Navbar */}
      <NavbarLanding />

      {/* Banner Section - Compact */}
      <div className="w-full pt-20 pb-4 animate-apple-fade-in">
        <div className="w-full">
          <Suspense
            fallback={
              <div className="relative w-full h-48 md:h-64 lg:h-80 overflow-hidden rounded-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-white to-orange-100 animate-pulse">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#023d50]/10 to-transparent animate-pulse"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-[#023d50]/30 border-t-[#fc9721] rounded-full animate-spin"></div>
                </div>
              </div>
            }
          >
            <BannerCarousel
              banners={banners}
              loading={bannersLoading}
              onBannerClick={handleBannerClick}
            />
          </Suspense>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="relative">
        {/* Hero Section */}
        <div className="animate-apple-slide-up">
          <Suspense
            fallback={
              <div className="relative bg-gradient-to-br from-white to-apple-gray-50 overflow-hidden py-16">
                <div className="w-full px-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            }
          >
            <UnlockYourPotential />
          </Suspense>
        </div>

        {/* Feature Sections */}
        <div className="relative bg-white compact-section">
          <div className="w-full px-6 space-apple-md">
            {/* Clean Card Design */}
            <div className="relative animate-apple-slide-up">
              <div className="card-apple compact-container hover-glow">
                <Suspense
                  fallback={
                    <div className="animate-pulse space-y-4 p-6">
                      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  }
                >
                  <Oneplace />
                </Suspense>
              </div>
            </div>

            <div
              className="relative animate-apple-slide-up"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="card-apple compact-container hover-glow bg-gradient-to-br from-apple-gray-50 to-white">
                <Suspense
                  fallback={
                    <div className="animate-pulse space-y-4 p-6">
                      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  }
                >
                  <Startlearning />
                </Suspense>
              </div>
            </div>

            <div
              className="relative animate-apple-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="card-apple compact-container hover-glow">
                <Suspense
                  fallback={
                    <div className="animate-pulse space-y-4 p-6">
                      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  }
                >
                  <Classes />
                </Suspense>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof Section */}
        <div className="relative gradient-apple-primary compact-section">
          <div className="relative w-full px-6">
            <div className="glass-apple rounded-apple-2xl compact-container shadow-apple-xl border border-white/20 animate-apple-slide-up">
              <Suspense
                fallback={
                  <div className="animate-pulse space-y-4 p-6">
                    <div className="h-6 bg-white/20 rounded w-1/2"></div>
                    <div className="h-4 bg-white/20 rounded w-full"></div>
                  </div>
                }
              >
                <StaticUser />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Client Testimonials */}
        <div className="relative bg-gradient-to-br from-apple-gray-50 to-white compact-section">
          <div className="w-full px-6">
            <div className="card-apple compact-container hover-glow animate-apple-slide-up">
              <Suspense
                fallback={
                  <div className="py-12 px-4">
                    <div className="animate-pulse space-y-6">
                      <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-48 bg-gray-200 rounded"
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                }
              >
                <ClientSay />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative bg-apple-gray-900">
          <Suspense
            fallback={
              <div className="bg-gradient-to-br from-[#023d50] to-[#0086b2] text-white py-16">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-white/20 rounded w-1/4"></div>
                    <div className="h-4 bg-white/20 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            }
          >
            <Footerlanding />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
