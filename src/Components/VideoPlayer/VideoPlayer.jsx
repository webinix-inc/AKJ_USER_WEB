import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactPlayer from "react-player";
import {
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaExpand,
  FaCompress,
  FaBackward,
  FaForward,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";
import HOC from "../HOC/HOC";
import api from "../../api/axios";

const VideoPlayer = () => {
  const { videoId, fileId } = useParams(); // Support both YouTube and file IDs
  const navigate = useNavigate();
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [videoQuality, setVideoQuality] = useState("360p");
  
  // New states for uploaded video support
  const [secureUrl, setSecureUrl] = useState(null);
  const [isSecureVideo, setIsSecureVideo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tokenRefreshInterval, setTokenRefreshInterval] = useState(null);

  const qualities = ["144p", "240p", "360p", "480p", "720p", "1080p"];
  const speeds = [0.25, 0.5, 1, 1.5, 2];

  // Generate secure URL for uploaded videos
  const generateSecureUrl = useCallback(async (targetFileId) => {
    if (!targetFileId) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data } = await api.post("/stream/generate-token", {
        fileId: targetFileId,
      });
      
      // Validate response data
      if (!data) {
        throw new Error("No response data received from server");
      }

      // Handle both direct URLs and streaming tokens
      let newSecureUrl;
      if (data.isDirectUrl) {
        if (!data.signedUrl) {
          throw new Error("Direct URL requested but no signed URL provided");
        }
        newSecureUrl = data.signedUrl;
      } else {
        if (!data.token) {
          throw new Error("Streaming token requested but no token provided");
        }
        newSecureUrl = `${api.defaults.baseURL}/stream/${data.token}`;
      }
      
      console.log("VideoPlayer - isDirectUrl:", data.isDirectUrl, "token:", data.token);
      setSecureUrl(newSecureUrl);
      return newSecureUrl;
    } catch (error) {
      console.error("Error generating secure URL:", error);
      setError("Failed to load video. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh token every 4 minutes (before 5-minute expiry)
  const setupTokenRefresh = useCallback((targetFileId) => {
    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval);
    }
    
    const interval = setInterval(() => {
      generateSecureUrl(targetFileId);
    }, 4 * 60 * 1000); // 4 minutes
    
    setTokenRefreshInterval(interval);
    
    return () => clearInterval(interval);
  }, [generateSecureUrl, tokenRefreshInterval]);

  // Initialize video source
  useEffect(() => {
    if (fileId) {
      // This is an uploaded video file
      setIsSecureVideo(true);
      generateSecureUrl(fileId).then(() => {
        setupTokenRefresh(fileId);
      });
    } else if (videoId) {
      // This is a YouTube video (original functionality)
      setIsSecureVideo(false);
      setSecureUrl(`https://www.youtube.com/watch?v=${videoId}`);
    }

    return () => {
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
    };
  }, [fileId, videoId, generateSecureUrl, setupTokenRefresh]);

  const handlePlayPause = () => {
    setPlaying((prev) => !prev);
  };

  const handleFullscreenToggle = () => {
    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
    setIsFullscreen((prev) => !prev);
  };

  const handleVolumeChange = (e) => {
    setVolume(e.target.value);
    setMuted(e.target.value === "0");
  };

  const handleSeekChange = (e) => {
    const newTime = (duration * e.target.value) / 100;
    setCurrentTime(newTime);
    playerRef.current.seekTo(newTime);
  };

  const handleDuration = (duration) => {
    setDuration(duration);
  };

  const handleProgress = (progress) => {
    setCurrentTime(progress.playedSeconds);
  };

  const handlePlaybackSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
  };

  const handleQualityChange = (quality) => {
    setVideoQuality(quality);
  };

  const handlePlay = () => {
    setPlaying(true);
  };

  const handlePause = () => {
    setPlaying(false);
  };

  // Retry mechanism for failed video loads
  const handleRetry = () => {
    if (fileId) {
      generateSecureUrl(fileId);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-gray-900" style={{ marginLeft: '3%', width: '95%' }}>
      <div className="relative w-full max-w-6xl mx-auto rounded-lg overflow-hidden shadow-2xl bg-black">
        {/* Close Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 right-4 z-20 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-all duration-200"
        >
          <FaTimes size={20} />
        </button>
        
        <div className="relative w-full h-0 pb-[56.25%]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
              <div className="text-white text-center">
                <FaSpinner className="animate-spin text-4xl mb-4 mx-auto" />
                <p>Loading video...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
              <div className="text-white text-center">
                <p className="mb-4">{error}</p>
                <button 
                  onClick={handleRetry}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          
          {secureUrl && !loading && !error && (
            <ReactPlayer
              ref={playerRef}
              url={secureUrl}
              className="absolute top-0 left-0"
              playing={playing}
              volume={muted ? 0 : volume}
              playbackRate={playbackSpeed}
              width="100%"
              height="100%"
              onDuration={handleDuration}
              onProgress={handleProgress}
              onPlay={handlePlay}
              onPause={handlePause}
              onError={(error) => {
                console.error("Video playback error:", error);
                setError("Video playback failed. Please try again.");
              }}
              controls={false}
              config={{
                youtube: {
                  playerVars: {
                    controls: 0,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    quality: videoQuality,
                  },
                },
                file: {
                  attributes: {
                    crossOrigin: 'anonymous',
                    controlsList: 'nodownload noremoteplayback',
                    disablePictureInPicture: true,
                    preload: 'metadata',
                    controls: false,
                  }
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Custom Controls Panel */}
      <div className="w-full max-w-6xl mx-auto bg-gray-800 rounded-lg p-4 mt-4">
        {/* Progress Bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max="100"
            value={(currentTime / duration) * 100 || 0}
            onChange={handleSeekChange}
            className="w-full bg-gray-600 appearance-none h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-white text-xs mt-1">
            <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
            <span>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-between">
          {/* Playback Controls */}
          <div className="flex items-center space-x-3">
            <button 
              className="text-white hover:text-blue-400 p-2 rounded-full hover:bg-gray-700 transition-all" 
              onClick={() => playerRef.current?.seekTo(currentTime - 10)}
            >
              <FaBackward size={18} />
            </button>
            <button 
              className="text-white hover:text-blue-400 p-3 rounded-full hover:bg-gray-700 transition-all bg-blue-600" 
              onClick={handlePlayPause}
            >
              {playing ? <FaPause size={20} /> : <FaPlay size={20} />}
            </button>
            <button 
              className="text-white hover:text-blue-400 p-2 rounded-full hover:bg-gray-700 transition-all" 
              onClick={() => playerRef.current?.seekTo(currentTime + 10)}
            >
              <FaForward size={18} />
            </button>
          </div>

          {/* Volume Controls */}
          <div className="flex items-center space-x-2">
            <button 
              className="text-white hover:text-blue-400 p-2 rounded-full hover:bg-gray-700 transition-all" 
              onClick={() => setMuted((prev) => !prev)}
            >
              {muted ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 bg-gray-600 rounded-lg h-1"
            />
          </div>

          {/* Settings */}
          <div className="flex items-center space-x-3">
            <select
              value={playbackSpeed}
              onChange={(e) => handlePlaybackSpeedChange(parseFloat(e.target.value))}
              className="bg-gray-700 text-white px-2 py-1 rounded text-sm border-none outline-none"
            >
              {speeds.map((speed) => (
                <option key={speed} value={speed}>
                  {speed}x
                </option>
              ))}
            </select>

            <select
              value={videoQuality}
              onChange={(e) => handleQualityChange(e.target.value)}
              className="bg-gray-700 text-white px-2 py-1 rounded text-sm border-none outline-none"
            >
              {qualities.map((quality) => (
                <option key={quality} value={quality}>
                  {quality}
                </option>
              ))}
            </select>

            <button 
              className="text-white hover:text-blue-400 p-2 rounded-full hover:bg-gray-700 transition-all" 
              onClick={handleFullscreenToggle}
            >
              {isFullscreen ? <FaCompress size={18} /> : <FaExpand size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Updated Tailwind Styles for child-component */}
      <div className="flex-1 p-12 pb-0 relative">
        {/* Add any additional content or components here */}
      </div>
    </div>
  );
};

export default HOC(VideoPlayer);
