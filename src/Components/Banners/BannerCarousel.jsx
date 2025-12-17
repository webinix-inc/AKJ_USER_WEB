// Components/Banners/BannerCarousel.jsx
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "./BannerCarousel.css";

const BannerCarousel = ({ banners = [], loading = false, onBannerClick }) => {

  if (loading) {
    return (
      <div className="relative w-full h-48 md:h-64 lg:h-80 overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-white to-orange-100 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#023d50]/10 to-transparent animate-pulse"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#023d50]/30 border-t-[#fc9721] rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!banners.length) {
    // Return null to hide banner section when no banners are available
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-br from-teal-50 to-blue-50 rounded-apple-lg shadow-apple">
      {/* Adaptive height container */}
      <div className="relative w-full" style={{ 
        minHeight: '200px',
        maxHeight: '400px',
        height: 'auto'
      }}>
        <Swiper
          spaceBetween={0}
          slidesPerView={1}
          loop={banners.length > 1}
          autoplay={banners.length > 1 ? { delay: 4000, disableOnInteraction: false } : false}
          pagination={banners.length > 1 ? { 
            clickable: true,
            bulletClass: 'swiper-pagination-bullet',
            bulletActiveClass: 'swiper-pagination-bullet-active'
          } : false}
          navigation={banners.length > 1 ? {
            nextEl: '.custom-next',
            prevEl: '.custom-prev',
          } : false}
          modules={[Autoplay, Pagination, Navigation]}
          className="w-full h-full banner-swiper"
        >
        {banners.map((b, i) => {
          // Handle different image field names from API
          const src = b.image || b.imageUrl || b.desktopImage || b.mobileImage;
          
          return (
            <SwiperSlide key={b._id || i}>
              <div className="relative w-full group">
                <button
                  onClick={() => onBannerClick?.(b)}
                  className="block w-full relative overflow-hidden rounded-apple-lg"
                  style={{ cursor: (b.course || b.externalLink) ? "pointer" : "default" }}
                  aria-label={b.name || b.title || `banner-${i}`}
                >
                  <img
                    src={src}
                    alt={b.alt || b.name || b.title || `banner-${i}`}
                    className="w-full h-auto object-contain transition-all duration-500 group-hover:scale-105 rounded-apple-lg"
                    crossOrigin="anonymous"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      // Show fallback placeholder
                      const placeholder = e.currentTarget.nextElementSibling;
                      if (placeholder) placeholder.style.display = 'flex';
                    }}
                    onLoad={(e) => {
                      // Ensure proper aspect ratio
                      const img = e.currentTarget;
                      const container = img.closest('.relative');
                      if (container && img.naturalHeight > 0) {
                        const aspectRatio = img.naturalWidth / img.naturalHeight;
                        const containerWidth = container.offsetWidth;
                        const calculatedHeight = containerWidth / aspectRatio;
                        
                        // Set reasonable height limits
                        const minHeight = 200;
                        const maxHeight = 400;
                        const finalHeight = Math.max(minHeight, Math.min(maxHeight, calculatedHeight));
                        
                        container.style.height = `${finalHeight}px`;
                      }
                    }}
                    style={{
                      backgroundColor: '#f8f9fa',
                      minHeight: '200px',
                      maxHeight: '400px'
                    }}
                  />
                  
                  {/* Fallback placeholder */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center rounded-apple-lg"
                    style={{ display: 'none' }}
                  >
                    <div className="text-center text-teal-600">
                      <div className="w-16 h-16 mx-auto mb-2 bg-teal-200 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium">Banner Image</p>
                    </div>
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-teal-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-apple-lg" />
                  
                  {/* Click indicator */}
                  {(b.course || b.externalLink) && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-apple">
                      <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  )}
                </button>
              </div>
            </SwiperSlide>
          );
        })}
        </Swiper>
        
        {/* Clean Navigation Buttons */}
        {banners.length > 1 && (
          <>
            <button className="custom-prev absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-teal-600 font-bold text-xl hover:bg-teal-600 hover:text-white transition-all duration-300 shadow-apple hover-lift">
              ‹
            </button>
            <button className="custom-next absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-teal-600 font-bold text-xl hover:bg-teal-600 hover:text-white transition-all duration-300 shadow-apple hover-lift">
              ›
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default BannerCarousel;
