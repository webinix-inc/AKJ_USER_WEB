import React, { useEffect, useState } from "react";
import { AiOutlineVideoCamera } from "react-icons/ai";
import {
  FaCompress,
  FaExclamationTriangle,
  FaExpand,
  FaPlay,
  FaTimes
} from "react-icons/fa";
import { MdVideoLibrary } from "react-icons/md";
import "swiper/css";
import "swiper/css/autoplay";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import api from "../../api/axios";

// Add custom styles for line-clamp
const customStyles = `
  .line-clamp-1 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }
  .line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
`;

// Inject styles if needed
if (typeof document !== 'undefined' && !document.getElementById('free-video-player-styles')) {
  const style = document.createElement('style');
  style.id = 'free-video-player-styles';
  style.textContent = customStyles;
  document.head.appendChild(style);
}

export default function FreeBatchVideoPlayer() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Video modal state
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const openVideoModal = (videoUrl, title) => {
    console.log('Opening video modal:', { videoUrl, title });
    setSelectedVideo({ url: videoUrl, title: title });
    setIsVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
    setIsVideoModalOpen(false);
  };

  // Function to fetch batches from the backend
  const fetchBatches = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get("admin/freeCourse");
      console.log('Free course API response:', response.data);
      
      // Handle different response structures
      if (response.data && Array.isArray(response.data)) {
        setBatches(response.data);
        setError(null);
        console.log('Set batches from direct array:', response.data.length, 'items');
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Handle nested data structure
        setBatches(response.data.data);
        setError(null);
        console.log('Set batches from nested data:', response.data.data.length, 'items');
      } else {
        setBatches([]);
        setError('Unexpected API response structure');
        console.log('Unexpected response structure:', response.data);
      }
    } catch (error) {
      console.log('Primary API failed:', error.message);
      // Try alternative endpoints
      try {
        const altResponse = await api.get("admin/free-courses");
        setBatches(altResponse.data || []);
        setError(null);
        console.log('Alternative API success:', altResponse.data);
      } catch (altError) {
        console.log('Alternative API failed:', altError.message);
        // Try user endpoint as fallback
        try {
          const userResponse = await api.get("user/freeCourse");
          setBatches(userResponse.data || []);
          setError(null);
          console.log('User API success:', userResponse.data);
        } catch (userError) {
          console.log('All APIs failed. User API error:', userError.message);
          setBatches([]);
          setError(`API Error: ${error.response?.status || error.message}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  return (
    <div className="w-full">
      <BatchSlider 
        batchData={batches} 
        openVideoModal={openVideoModal}
        loading={loading}
        error={error}
        onRefresh={fetchBatches}
      />
      
      {/* Video Modal */}
      {isVideoModalOpen && selectedVideo && (
        <VideoModal video={selectedVideo} onClose={closeVideoModal} />
      )}
    </div>
  );
}

function BatchSlider({ batchData, openVideoModal, loading, error, onRefresh }) {
  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          <span className="ml-3 text-sm text-apple-gray-600">Loading free classes...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="card-apple p-4 text-center">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mb-3 mx-auto">
            <FaExclamationTriangle className="text-lg text-red-600" />
          </div>
          <h3 className="text-sm font-bold text-red-900 mb-2 font-apple">Failed to load free classes</h3>
          <p className="text-xs text-red-600 mb-3 font-apple">{error}</p>
          <button 
            onClick={onRefresh}
            className="btn-apple-primary px-4 py-2 text-xs hover-lift"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Swiper
        spaceBetween={8}
        slidesPerView={1}
        breakpoints={{
          1280: {
            slidesPerView: 4,
            spaceBetween: 12,
          },
          1024: {
            slidesPerView: 4,
            spaceBetween: 10,
          },
          768: {
            slidesPerView: 3,
            spaceBetween: 8,
          },
          640: {
            slidesPerView: 2,
            spaceBetween: 8,
          },
        }}
        modules={[Autoplay]}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        className="pb-2"
      >
        {batchData.length > 0 ? (
          batchData.map((batch, index) => (
            <SwiperSlide key={index}>
              <BatchCard batch={batch} openVideoModal={openVideoModal} />
            </SwiperSlide>
          ))
        ) : (
          <SwiperSlide>
            <div className="bg-white rounded-xl border-2 border-dashed border-teal-300 p-6 text-center h-full flex flex-col items-center justify-center aspect-video">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                <MdVideoLibrary className="text-3xl text-teal-500" />
              </div>
              <h3 className="text-base font-bold text-apple-gray-900 mb-2 font-apple">No Free Classes Available</h3>
              <p className="text-sm text-apple-gray-600 font-apple mb-3">Check back later for new free classes!</p>
              <div className="inline-flex items-center px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                <AiOutlineVideoCamera className="mr-1" />
                Coming Soon
              </div>
            </div>
          </SwiperSlide>
        )}
      </Swiper>
    </div>
  );
}

function BatchCard({ batch, openVideoModal }) {
  const { title, description, startDate, videoSrc, videoUrl, url, link } = batch;
  
  // Try multiple possible video URL fields
  const possibleVideoUrl = videoSrc || videoUrl || url || link || batch.video || batch.videoLink;
  
  const videoId = getYouTubeVideoId(possibleVideoUrl);
  
  // Use maxresdefault for higher quality, fallback to hqdefault if not available
  const videoThumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
  const fallbackThumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

  return (
    <div className="group bg-white rounded-apple-lg shadow-apple hover:shadow-apple-lg transition-all duration-300 ease-apple overflow-hidden cursor-pointer hover-lift w-full">
      <div 
        className="relative aspect-video overflow-hidden rounded-t-apple-lg"
        onClick={() => {
          if (possibleVideoUrl) {
            openVideoModal(possibleVideoUrl, title);
          } else {
            alert('Video URL not available for this course');
          }
        }}
      >
        {videoThumbnail ? (
          <img
            src={videoThumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-apple"
            loading="lazy"
            onError={(e) => {
              // Fallback to lower quality if maxres is not available
              if (e.target.src.includes('maxresdefault')) {
                e.target.src = fallbackThumbnail;
              } else {
                // If both thumbnails fail, show a placeholder
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }
            }}
            onLoad={(e) => {
              e.target.style.opacity = '1';
            }}
            style={{ 
              opacity: '0', 
              transition: 'opacity 0.3s ease-in-out',
              backgroundColor: '#f3f4f6'
            }}
          />
        ) : null}
        
        {/* Fallback placeholder */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center"
          style={{ display: videoThumbnail ? 'none' : 'flex' }}
        >
          <AiOutlineVideoCamera className="text-4xl text-teal-500" />
        </div>
        
        {/* Play button overlay */}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <FaPlay className="text-teal-600 ml-1" size={16} />
          </div>
        </div>
        
        {/* Live badge */}
        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
          FREE
        </div>
      </div>
      
      <div className="p-3">
        <h3 className="text-sm font-semibold text-apple-gray-900 mb-1 line-clamp-1 font-apple">
          {title || "Free Class"}
        </h3>
        {description && (
          <p className="text-xs text-apple-gray-600 line-clamp-2 font-apple">
            {description}
          </p>
        )}
        {startDate && (
          <p className="text-xs text-apple-gray-500 mt-1 font-apple">
            {new Date(startDate).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

function getYouTubeVideoId(videoUrl) {
  if (!videoUrl || typeof videoUrl !== 'string') {
    return null;
  }
  
  // Multiple regex patterns to handle different YouTube URL formats
  const patterns = [
    // Standard watch URLs
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    // Shortened URLs
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // Embed URLs
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    // Mobile URLs
    /(?:https?:\/\/)?m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    // Other formats with v parameter
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/,
    // Just the video ID (11 characters)
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (let i = 0; i < patterns.length; i++) {
    const matches = videoUrl.match(patterns[i]);
    if (matches && matches[1]) {
      return matches[1];
    }
  }
  
  return null;
}

function VideoModal({ video, onClose }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoId = getYouTubeVideoId(video.url);
  
  const embedUrl = videoId 
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&showinfo=0&controls=1&disablekb=1&fs=1&iv_load_policy=3&enablejsapi=1&origin=${window.location.origin}&cc_load_policy=0&color=white&playsinline=1&widget_referrer=${window.location.origin}&branding=0&autohide=1`
    : null;

  // Window-based fullscreen functionality (maximizes within browser window)
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Error state for invalid video
  if (!videoId || !embedUrl) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-apple-2xl shadow-apple-xl max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <FaExclamationTriangle className="text-2xl text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-red-900 mb-2 font-apple">Video Unavailable</h3>
          <p className="text-sm text-red-600 mb-4 font-apple">
            Could not load the video. The video URL might be invalid or the video may have been removed.
          </p>
          <button
            onClick={onClose}
            className="btn-apple-primary px-4 py-2 hover-lift"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed bg-black/80 backdrop-blur-sm z-50 transition-all duration-300 ${
      isFullscreen 
        ? 'inset-0' 
        : 'inset-0 flex items-center justify-center p-4'
    }`}>
      <div 
        id="video-modal-container"
        className={`relative bg-gradient-to-br from-gray-900 to-black overflow-hidden shadow-2xl border border-white/10 transition-all duration-300 ${
          isFullscreen 
            ? 'w-full h-full rounded-none' 
            : 'w-full max-w-5xl aspect-video rounded-2xl'
        }`}
      >
        {/* Control buttons - top right */}
        <div className="absolute top-2 right-2 z-30 flex space-x-2">
          {/* Fullscreen toggle button */}
          <button
            onClick={toggleFullscreen}
            className="w-12 h-12 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center transition-colors duration-200 text-white shadow-lg border-2 border-white/20"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <FaCompress size={18} /> : <FaExpand size={18} />}
          </button>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="w-12 h-12 bg-red-600/80 hover:bg-red-700/90 rounded-full flex items-center justify-center transition-colors duration-200 text-white shadow-lg border-2 border-white/20"
            title="Close Video"
          >
            <FaTimes size={18} />
          </button>
        </div>
        
        {/* YouTube iframe */}
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full object-cover"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={video.title}
          style={{
            borderRadius: "16px",
            background: "linear-gradient(135deg, #1f2937, #111827)"
          }}
        />
        
        {/* Secondary AKJ Branding - Bottom Right (covers YouTube logo) */}
        <div className="absolute bottom-2 right-2 z-15 bg-gradient-to-r from-teal-600/80 to-teal-700/80 rounded-lg px-3 py-1.5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <span className="text-teal-600 font-bold text-xs">A</span>
            </div>
            <span className="text-white text-xs font-semibold">AKJ</span>
          </div>
        </div>
        
        {/* Hide YouTube Controls Overlay - Bottom Right Corner */}
        <div className="absolute bottom-0 right-0 w-28 h-14 bg-black bg-opacity-0 z-14 pointer-events-none"></div>
        
        {/* Hide YouTube Logo Overlay - Top Right */}
        <div className="absolute top-0 right-0 w-32 h-12 bg-black bg-opacity-0 z-14 pointer-events-none"></div>
        
        {/* Hide YouTube Title Overlay - Full Top Bar */}
        <div className="absolute top-0 left-0 w-full h-16 bg-black z-18 pointer-events-none"></div>
        
        {/* Clear area for control buttons - Top Right */}
        <div className="absolute top-0 right-0 w-32 h-20 bg-transparent z-25 pointer-events-none"></div>
        
        {/* Single Main AKJ Branding - Top Left (avoid overlap with controls) */}
        <div className="absolute top-3 left-3 z-20 bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl px-4 py-3 shadow-xl backdrop-blur-sm border border-white/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-teal-600 font-bold text-lg">A</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white text-sm font-bold truncate max-w-xs">{video.title || "AKJ Free Video"}</span>
              <span className="text-teal-200 text-xs font-medium">AKJ Classes • Free Learning</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
