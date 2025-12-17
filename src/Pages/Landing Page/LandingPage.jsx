import React, { useState, useEffect } from "react";
import NavbarLanding from "./NavbarLanding";
import UnlockYourPotential from "./UnlockYourPotential";
import Oneplace from "./Oneplace";
import Startlearning from "./Startlearning";
import Classes from "./Classes";
import ClientSay from "./ClientSay";
import Footerlanding from "./Footerlanding";
import StaticUser from "./StaticUser";
import BannerCarousel from "../../Components/Banners/BannerCarousel";

const LandingPage = () => {
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(false);

  // Fetch banners for landing page
  const fetchBanners = async () => {
    setBannersLoading(true);
    try {
      // 🔧 FIX: Use consistent API URL structure
      const baseURL = process.env.REACT_APP_API_URL || 'https://lms-backend-724799456037.europe-west1.run.app/api/v1';
      const apiUrl = `${baseURL}/admin/banner`;
      
      console.log('🔍 Fetching banners from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Banner response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Banner data received:', data);
      
      if (data.status === 200 && data.data && Array.isArray(data.data)) {
        console.log(`✅ Setting ${data.data.length} banners`);
        setBanners(data.data);
      } else {
        console.log('⚠️ No banner data found');
        setBanners([]);
      }
    } catch (error) {
      console.error('❌ Error fetching banners:', error);
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
      // Navigate to course details page
      window.location.href = `/explorecourses/${banner.course._id}`;
      return;
    }
    
    // Handle external link if provided
    if (banner.externalLink?.trim()) {
      window.open(banner.externalLink.trim(), "_blank", "noopener,noreferrer");
      return;
    }
    
    // Default: navigate to explore courses page
    window.location.href = "/explorecourses";
  };

  return (
    <div className="min-h-screen overflow-x-hidden font-apple" style={{background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #f0f0f0 100%)'}}>
      {/* Navbar */}
      <NavbarLanding />
      
      {/* Banner Section - Compact */}
      <div className="w-full pt-20 pb-4 animate-apple-fade-in">
        <div className="w-full">
          <BannerCarousel 
            banners={banners} 
            loading={bannersLoading} 
            onBannerClick={handleBannerClick} 
          />
        </div>
      </div>
      
      {/* Main Content Sections */}
      <div className="relative">
        {/* Hero Section */}
        <div className="animate-apple-slide-up">
          <UnlockYourPotential />
        </div>
        
        {/* Feature Sections */}
        <div className="relative bg-white compact-section">
          <div className="w-full px-6 space-apple-md">
            {/* Clean Card Design */}
            <div className="relative animate-apple-slide-up">
              <div className="card-apple compact-container hover-glow">
                <Oneplace />
              </div>
            </div>
            
            <div className="relative animate-apple-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="card-apple compact-container hover-glow bg-gradient-to-br from-apple-gray-50 to-white">
                <Startlearning />
              </div>
            </div>
            
            <div className="relative animate-apple-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="card-apple compact-container hover-glow">
                <Classes />
              </div>
            </div>
          </div>
        </div>
        
        {/* Social Proof Section */}
        <div className="relative gradient-apple-primary compact-section">
          <div className="relative w-full px-6">
            <div className="glass-apple rounded-apple-2xl compact-container shadow-apple-xl border border-white/20 animate-apple-slide-up">
              <StaticUser />
            </div>
          </div>
        </div>
        
        {/* Client Testimonials */}
        <div className="relative bg-gradient-to-br from-apple-gray-50 to-white compact-section">
          <div className="w-full px-6">
            <div className="card-apple compact-container hover-glow animate-apple-slide-up">
              <ClientSay />
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="relative bg-apple-gray-900">
          <Footerlanding />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
