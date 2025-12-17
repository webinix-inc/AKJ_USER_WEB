import { CloseOutlined, LoadingOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Modal, Spin, Tooltip, message } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { AiOutlineFile } from "react-icons/ai";
import {
  FaCompress,

  FaDownload,
  FaExpand,
  FaEye,
  FaFile,
  FaFileAlt,
  FaFileArchive,
  FaFileCode,
  FaFileExcel,
  FaFileImage,
  FaFilePdf,
  FaFilePowerpoint,
  FaFileVideo,
  FaFileWord,
  FaFolder,
  FaLock,
  FaPlay,
  FaUnlock
} from "react-icons/fa";
import { useCourseContext } from "../../../Context/CourseContext";
import { useUser } from "../../../Context/UserContext";

import api from "../../../api/axios";

// Helper function to extract YouTube video ID from various URL formats
const getYouTubeVideoId = (videoUrl) => {
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
};

// Helper function to check if a URL is a YouTube video
const isYouTubeVideo = (fileUrl, fileType) => {
  return fileType === 'youtube' || 
         (fileUrl && (fileUrl.includes('youtube.com') || fileUrl.includes('youtu.be'))) ||
         getYouTubeVideoId(fileUrl) !== null;
};

// Helper function to get file icon and color based on file type
const getFileIcon = (fileName, fileUrl, fileType) => {
  // Check if it's a video (including YouTube)
  if (isYouTubeVideo(fileUrl, fileType)) {
    return { icon: FaPlay, color: '#3b82f6', bgColor: '#dbeafe' }; // Blue video icon (no YouTube branding)
  }
  
  const extension = fileName?.split('.').pop()?.toLowerCase() || fileUrl?.split('.').pop()?.toLowerCase() || '';
  
  const iconConfig = {
    // Video files
    mp4: { icon: FaFileVideo, color: '#ff6b6b', bgColor: '#ffe0e0' },
    avi: { icon: FaFileVideo, color: '#ff6b6b', bgColor: '#ffe0e0' },
    mkv: { icon: FaFileVideo, color: '#ff6b6b', bgColor: '#ffe0e0' },
    mov: { icon: FaFileVideo, color: '#ff6b6b', bgColor: '#ffe0e0' },
    webm: { icon: FaFileVideo, color: '#ff6b6b', bgColor: '#ffe0e0' },
    
    // PDF files
    pdf: { icon: FaFilePdf, color: '#e74c3c', bgColor: '#fdf2f2' },
    
    // Image files
    jpg: { icon: FaFileImage, color: '#3498db', bgColor: '#e8f4fd' },
    jpeg: { icon: FaFileImage, color: '#3498db', bgColor: '#e8f4fd' },
    png: { icon: FaFileImage, color: '#3498db', bgColor: '#e8f4fd' },
    gif: { icon: FaFileImage, color: '#3498db', bgColor: '#e8f4fd' },
    svg: { icon: FaFileImage, color: '#3498db', bgColor: '#e8f4fd' },
    
    // Document files
    doc: { icon: FaFileWord, color: '#2980b9', bgColor: '#e8f1f8' },
    docx: { icon: FaFileWord, color: '#2980b9', bgColor: '#e8f1f8' },
    txt: { icon: FaFileAlt, color: '#7f8c8d', bgColor: '#f8f9fa' },
    
    // Spreadsheet files
    xls: { icon: FaFileExcel, color: '#27ae60', bgColor: '#e8f5e8' },
    xlsx: { icon: FaFileExcel, color: '#27ae60', bgColor: '#e8f5e8' },
    
    // Presentation files
    ppt: { icon: FaFilePowerpoint, color: '#e67e22', bgColor: '#fef4e8' },
    pptx: { icon: FaFilePowerpoint, color: '#e67e22', bgColor: '#fef4e8' },
    
    // Archive files
    zip: { icon: FaFileArchive, color: '#8e44ad', bgColor: '#f4e8f7' },
    rar: { icon: FaFileArchive, color: '#8e44ad', bgColor: '#f4e8f7' },
    '7z': { icon: FaFileArchive, color: '#8e44ad', bgColor: '#f4e8f7' },
    
    // Code files
    js: { icon: FaFileCode, color: '#f39c12', bgColor: '#fef9e8' },
    jsx: { icon: FaFileCode, color: '#f39c12', bgColor: '#fef9e8' },
    html: { icon: FaFileCode, color: '#f39c12', bgColor: '#fef9e8' },
    css: { icon: FaFileCode, color: '#f39c12', bgColor: '#fef9e8' },
    json: { icon: FaFileCode, color: '#f39c12', bgColor: '#fef9e8' }
  };
  
  return iconConfig[extension] || { icon: FaFile, color: '#95a5a6', bgColor: '#f8f9fa' };
};

// Add custom styles for enhanced UI and YouTube branding removal
const customStyles = `
  .enhanced-preview-modal .ant-modal-content {
    border-radius: 16px !important;
    overflow: hidden;
    background: linear-gradient(135deg, #1f2937, #111827) !important;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .enhanced-preview-modal .ant-modal-header {
    border-bottom: none;
    padding: 0;
    background: transparent;
  }
  .enhanced-preview-modal .ant-modal-body {
    padding: 0;
    background: linear-gradient(135deg, #1f2937, #111827);
  }
  .enhanced-preview-modal .ant-modal-mask {
    backdrop-filter: blur(8px);
    background: rgba(0, 0, 0, 0.8);
  }
  .line-clamp-1 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }
  
  /* Hide YouTube branding elements */
  .youtube-overlay-container {
    position: relative;
    overflow: hidden;
    border-radius: 0 0 16px 16px;
  }
  
  .youtube-overlay-container iframe {
    pointer-events: auto;
    border-radius: 0 0 16px 16px;
  }
  
  /* Additional YouTube branding suppression */
  .youtube-brand-overlay {
    position: absolute;
    background: rgba(0, 0, 0, 0.95);
    pointer-events: none;
    z-index: 14;
    border-radius: 4px;
  }
  
  .akj-branding {
    position: absolute;
    z-index: 20;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border-radius: 12px;
    padding: 12px 16px;
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    transform: translateZ(0);
    transition: all 0.3s ease;
  }
  
  .akj-branding:hover {
    transform: translateY(-2px) translateZ(0);
    box-shadow: 0 16px 45px rgba(0, 0, 0, 0.6);
  }
  
  /* Smooth animations */
  .enhanced-preview-modal {
    animation: modalFadeIn 0.3s ease-out;
  }
  
  @keyframes modalFadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

// Inject styles if needed
if (typeof document !== 'undefined' && !document.getElementById('user-file-viewer-styles')) {
  const style = document.createElement('style');
  style.id = 'user-file-viewer-styles';
  style.textContent = customStyles;
  document.head.appendChild(style);
}

export const FileViewer = ({ rootFolderId, isPurchased, onLoadingChange }) => {
  const { fetchFolderContents, folderContents, loading, error } =
    useCourseContext();
  const { profileData } = useUser();
  const [folderId, setFolderId] = useState(rootFolderId);
  const [path, setPath] = useState([{ id: rootFolderId, name: "Content" }]);
  const [previewFile, setPreviewFile] = useState(null);
  const [blobCache, setBlobCache] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadingToast, setLoadingToast] = useState(null);
  const loadingTimeoutRef = useRef(null);

  // FIX: Prevent excessive API calls by removing profileData dependency
  const hasInitiallyFetched = useRef(false);
  
  useEffect(() => {
    // Only fetch when folderId changes or on initial mount
    if (folderId && (!hasInitiallyFetched.current || folderId !== rootFolderId)) {
      fetchFolderContents(folderId, profileData);
      hasInitiallyFetched.current = true;
    }
  }, [folderId, fetchFolderContents]); // Remove profileData dependency to prevent excessive calls
  
  // Show loading toast if loading takes more than 2 seconds
  useEffect(() => {
    if (loading) {
      // Clear any existing timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      // Set timeout to show toast after 2 seconds
      loadingTimeoutRef.current = setTimeout(() => {
        // Double-check loading is still true
        if (loading && !loadingToast) {
          const toastId = toast.loading("Loading course materials and files...", {
            position: "top-right",
            autoClose: false,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
          });
          setLoadingToast(toastId);
        }
      }, 2000);
      
      if (onLoadingChange) {
        onLoadingChange(true);
      }
    } else {
      // Loading finished - dismiss toast and show success
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      if (loadingToast) {
        toast.dismiss(loadingToast);
        toast.success("Course materials loaded!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
        });
        setLoadingToast(null);
      }
      
      if (onLoadingChange) {
        onLoadingChange(false);
      }
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loading, loadingToast, onLoadingChange]);

  const handleItemClick = (item, type) => {
    if (type === "folder") {
      // Check if the folder ID is valid and different from current
      if (!item._id) {
        message.error('Invalid folder data - missing ID');
        return;
      }
      
      if (item._id === folderId) {
        return;
      }
      
      setFolderId(item._id);
      
      const newPath = [...path, { id: item._id, name: item.name }];
      setPath(newPath);
      
      // Force refresh folder contents to ensure nested folders load properly
      fetchFolderContents(item._id, profileData, true);
    } else if (item.isViewable) {
      handleViewClick(item);
    } else {
      message.warning(`File is locked: ${item.name}`);
    }
  };

  const handleBreadcrumbClick = (item, index) => {
    if (index < path.length - 1) {
      setFolderId(item.id);
      const newPath = path.slice(0, index + 1);
      setPath(newPath);
      
      // Force refresh folder contents when navigating via breadcrumb
      fetchFolderContents(item.id, profileData, true);
    }
  };

  const [loadingFile, setLoadingFile] = useState(null);
  const [tokenRefreshInterval, setTokenRefreshInterval] = useState(null);

  const handleViewClick = async (file) => {
    // Handle YouTube videos - use iframe embedding instead of external redirect
    if (isYouTubeVideo(file.url, file.type)) {
      const videoId = getYouTubeVideoId(file.url);
      if (videoId) {
        // Create embed URL with maximum branding suppression parameters
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&showinfo=0&controls=1&disablekb=1&fs=1&iv_load_policy=3&enablejsapi=1&origin=${window.location.origin}&cc_load_policy=0&color=white&playsinline=1&widget_referrer=${window.location.origin}&branding=0&autohide=1`;
        setPreviewFile({ 
          ...file, 
          secureUrl: embedUrl, 
          fileExtension: 'youtube',
          isYouTube: true,
          videoId: videoId
        });
        return;
      } else {
        message.error("Invalid YouTube video URL");
        return;
      }
    }

    if (blobCache[file._id]) {
      setPreviewFile({ ...file, secureUrl: blobCache[file._id] });
      return;
    }

    setLoadingFile(file._id);
    
    try {
      // Generate your access token
      const { data } = await api.post("/stream/generate-token", {
        fileId: file._id,
      });

      // Validate response data
      if (!data) {
        throw new Error("No response data received from server");
      }

      // Check if it's a direct URL (for PDFs and videos)
      let secureUrl;
      if (data.isDirectUrl) {
        if (!data.signedUrl) {
          throw new Error("Direct URL requested but no signed URL provided");
        }
        secureUrl = data.signedUrl;
      } else {
        if (!data.token) {
          throw new Error("Streaming token requested but no token provided");
        }
        secureUrl = `${api.defaults.baseURL}/stream/${data.token}`;
      }
      
      const extractFileExtension = (file) => {
        const urlParts = file.url.split("?");
        const cleanUrl = urlParts[0];
        return cleanUrl.split(".").pop().toLowerCase();
      };

      const fileExtension = extractFileExtension(file);

      if (fileExtension === "pdf") {
        try {
          // Fetch the PDF and generate a Blob URL
          const response = await fetch(secureUrl);
          if (!response.ok) {
            throw new Error(
              `Failed to fetch: ${response.status} ${response.statusText}`
            );
          }

          const blob = await response.blob();
          
          // Verify it's actually a PDF
          if (blob.type !== 'application/pdf' && !blob.type.includes('pdf')) {
            // File may not be a valid PDF, but continue anyway
          }
          
          const blobUrl = URL.createObjectURL(blob);

          // Cache blob and set preview for PDF
          setBlobCache((prev) => ({ ...prev, [file._id]: blobUrl }));
          setPreviewFile({ 
            ...file, 
            secureUrl: blobUrl, 
            fileExtension,
            originalUrl: secureUrl // Keep original URL as fallback
          });
        } catch (pdfError) {
          // Fallback: try to open PDF directly
          setPreviewFile({ 
            ...file, 
            secureUrl: secureUrl, 
            fileExtension,
            useFallback: true
          });
        }
      } else {
        // For videos or other files, use the secure URL directly
        setPreviewFile({ ...file, secureUrl, fileExtension });
        
        // Setup token refresh for video files
        if (["mp4", "webm", "mkv", "avi", "mov"].includes(fileExtension)) {
          setupTokenRefresh(file._id);
        }
      }
    } catch (error) {
      message.error("Failed to load file. Please try again.");
    } finally {
      setLoadingFile(null);
    }
  };

  // Auto-refresh token for video files
  const setupTokenRefresh = (fileId) => {
    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval);
    }
    
    const interval = setInterval(async () => {
      try {
        const { data } = await api.post("/stream/generate-token", { fileId });
        
        // Validate response data
        if (!data) {
          throw new Error("No response data received from server during token refresh");
        }

        // Handle both direct URLs and streaming tokens
        let newSecureUrl;
        if (data.isDirectUrl) {
          if (!data.signedUrl) {
            throw new Error("Direct URL requested but no signed URL provided during refresh");
          }
          newSecureUrl = data.signedUrl;
        } else {
          if (!data.token) {
            throw new Error("Streaming token requested but no token provided during refresh");
          }
          newSecureUrl = `${api.defaults.baseURL}/stream/${data.token}`;
        }
        
        setPreviewFile(prev => prev && prev._id === fileId ? 
          { ...prev, secureUrl: newSecureUrl } : prev
        );
      } catch (error) {
        // Token refresh failed, but continue silently
      }
    }, 4 * 60 * 1000); // 4 minutes
    
    setTokenRefreshInterval(interval);
  };

  // console.log("PeeviewFile is here : ", previewFile);
  // console.log("Profile data at fileViewerer :", profileData);

  const closePreviewModal = () => {
    // Cleanup token refresh interval
    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval);
      setTokenRefreshInterval(null);
    }
    
    // Cleanup blob URLs to prevent memory leaks
    if (previewFile && previewFile.secureUrl && previewFile.secureUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewFile.secureUrl);
    }
    
    setPreviewFile(null);
  };

  // Window-based fullscreen functionality (maximizes within browser window)
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
      // Cleanup all blob URLs
      Object.values(blobCache).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [tokenRefreshInterval, blobCache]);

  const renderItem = (item, type) => {
    const isLocked = !item.isViewable;
    const isLoading = loadingFile === item._id;
    const { icon: FileIcon, color, bgColor } = type === 'folder' ? 
      { icon: FaFolder, color: '#3b82f6', bgColor: '#dbeafe' } : 
      getFileIcon(item.name, item.url, item.type);

    return (
      <div 
        className="group relative p-6 rounded-apple-xl cursor-pointer transition-all duration-300 ease-apple hover-lift bg-white hover:bg-apple-gray-50 border border-apple-gray-200 hover:border-apple-blue-300 mb-4 shadow-apple-sm hover:shadow-apple"
        onClick={() => handleItemClick(item, type)}
      >
        <div className="flex items-center space-x-4">
          {/* Icon Container */}
          <div 
            className="flex items-center justify-center w-16 h-16 rounded-apple-xl shadow-apple-sm relative group-hover:scale-105 transition-transform duration-300 border border-apple-gray-200"
            style={{ backgroundColor: isLocked ? '#fee2e2' : bgColor }}
          >
            {isLoading ? (
              <LoadingOutlined className="text-2xl" style={{ color: color }} />
            ) : (
              <FileIcon 
                className="text-2xl" 
                style={{ color: isLocked ? '#ef4444' : color }}
              />
            )}
            
            {/* Lock/Unlock indicator */}
            <div className="absolute -top-1 -right-1">
              {type === 'file' && (
                isLocked ? (
                  <Tooltip title="This file is locked - purchase the course to unlock">
                    <FaLock className="w-4 h-4 text-red-500 bg-white rounded-full p-0.5 shadow-sm" />
                  </Tooltip>
                ) : (
                  <FaUnlock className="w-4 h-4 text-green-500 bg-white rounded-full p-0.5 shadow-sm" />
                )
              )}
            </div>
            
            {/* Play button for videos (including YouTube) */}
            {type === 'file' && !isLocked && (
              item.name?.includes('.mp4') || 
              item.url?.includes('.mp4') || 
              isYouTubeVideo(item.url, item.type)
            ) && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <FaPlay className="text-white text-sm rounded-full p-2 w-8 h-8 bg-blue-600 bg-opacity-90" />
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-apple-gray-800 group-hover:text-apple-blue-600 transition-colors duration-200 truncate font-apple">
              {item.name}
            </h3>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-sm text-apple-gray-600 font-apple">
                {type === "folder" 
                  ? `📁 Folder • ${(item.files?.length || 0) + (item.folders?.length || 0)} items`
                  : isYouTubeVideo(item.url, item.type)
                    ? `🎥 Video • ${item.description || "Click to watch"}`
                    : `📄 ${item.url?.split('.').pop()?.toUpperCase() || 'File'} • ${item.description || "No description"}`
                }
              </span>
              
              {/* Status badge */}
              {type === 'file' && (
                <span 
                  className={`inline-flex items-center px-3 py-1 rounded-apple text-xs font-medium font-apple ${
                    isLocked 
                      ? 'bg-apple-red/10 text-apple-red border border-apple-red/20' 
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {isLocked ? (
                    <><FaLock className="w-3 h-3 mr-1" /> Locked</>
                  ) : (
                    <><FaUnlock className="w-3 h-3 mr-1" /> Available</>
                  )}
                </span>
              )}
            </div>
          </div>
          
          {/* Action indicators */}
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {type === 'file' && !isLocked && (
              <Tooltip title="Click to preview">
                <div className="p-2 rounded-apple bg-apple-blue-50 hover:bg-apple-blue-100 transition-colors">
                  <FaEye className="text-apple-blue-600 hover:text-apple-blue-700 transition-colors" />
                </div>
              </Tooltip>
            )}
            {type === 'folder' && (
              <Tooltip title="Click to open folder">
                <div className="p-2 rounded-apple bg-apple-blue-50 hover:bg-apple-blue-100 transition-colors">
                  <FaFolder className="text-apple-blue-600 hover:text-apple-blue-700 transition-colors" />
                </div>
              </Tooltip>
            )}
          </div>
        </div>
        
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <LoadingOutlined className="text-2xl text-black mb-2" />
              <p className="text-sm text-gray-600">Loading...</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const combinedItems = folderContents
    ? [
        ...(folderContents.folders || [])
          .filter((folder) => {
            // Hide assignment folders from students
            const folderName = folder.name?.toLowerCase() || '';
            const folderType = folder.folderType?.toLowerCase() || '';
            
            // Check multiple variations of assignment folder names
            const isAssignmentFolder = 
              folderName.includes('assignment') ||
              folderName.includes('assignments') ||
              folderType === 'assignments' ||
              folderType === 'student_assignments' ||
              folderName === 'assignment' ||
              folderName === 'assignments';
            
            return !isAssignmentFolder;
          })
          .map((folder) => ({
            ...folder,
            type: "folder",
            // Ensure _id field exists - sometimes API returns 'id' instead of '_id'
            _id: folder._id || folder.id,
          })),
        ...(folderContents.files || []).map((file) => ({
          ...file,
          type: "file",
          // Ensure _id field exists - sometimes API returns 'id' instead of '_id'
          _id: file._id || file.id,
        })),
      ]
    : [];

  // Debug logging for folder contents
  console.log('📂 [DEBUG] FileViewer render - Current state:', {
    folderId,
    folderContents,
    combinedItemsCount: combinedItems.length,
    totalFoldersCount: folderContents?.folders?.length || 0,
    visibleFoldersCount: (folderContents?.folders || []).filter(folder => {
      const folderName = folder.name?.toLowerCase() || '';
      const folderType = folder.folderType?.toLowerCase() || '';
      
      const isAssignmentFolder = 
        folderName.includes('assignment') ||
        folderName.includes('assignments') ||
        folderType === 'assignments' ||
        folderType === 'student_assignments' ||
        folderName === 'assignment' ||
        folderName === 'assignments';
      
      return !isAssignmentFolder;
    }).length,
    filesCount: folderContents?.files?.length || 0,
    loading,
    error,
    allFolders: folderContents?.folders?.map(f => ({ id: f._id, name: f.name })) || [],
    visibleFolders: (folderContents?.folders || [])
      .filter(folder => {
        const folderName = folder.name?.toLowerCase() || '';
        const folderType = folder.folderType?.toLowerCase() || '';
        
        const isAssignmentFolder = 
          folderName.includes('assignment') ||
          folderName.includes('assignments') ||
          folderType === 'assignments' ||
          folderType === 'student_assignments' ||
          folderName === 'assignment' ||
          folderName === 'assignments';
        
        return !isAssignmentFolder;
      })
      .map(f => ({ id: f._id, name: f.name, type: f.folderType })),
    files: folderContents?.files?.map(f => ({ id: f._id, name: f.name })) || []
  });

  if (loading) return <Spin size="large" />;
  if (error)
    return <div>Error: {error.message || "Failed to load contents"}</div>;

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      {/* Enhanced Breadcrumb */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8 mx-6">
        <Breadcrumb className="cursor-pointer">
          {path.map((item, index) => (
            <Breadcrumb.Item
              key={item.id}
              onClick={() => handleBreadcrumbClick(item, index)}
              className="text-black hover:text-gray-700 transition-colors duration-200"
            >
              <span className="flex items-center space-x-1">
                {index === 0 && <FaFolder className="w-4 h-4 text-black" />}
                <span>{item.name}</span>
              </span>
            </Breadcrumb.Item>
          ))}
        </Breadcrumb>
      </div>
      
      {/* Content Header - Hidden for users */}
      
      {/* Files and Folders Grid */}
      <div className="bg-white rounded-lg shadow-sm p-8 mx-6">
        {combinedItems.length > 0 ? (
          <div className="space-y-0">
            {combinedItems.map((item) => (
              <div key={item._id}>
                {renderItem(item, item.type)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <AiOutlineFile className="text-6xl mb-4 opacity-50" />
              <p className="text-lg font-medium text-gray-600">No files or folders found</p>
              <p className="text-sm text-gray-500 mt-1">This folder is currently empty</p>
            </div>
          </div>
        )}
      </div>
      {/* PDF files are displayed in full-screen iframe, other files in modal */}
      {previewFile?.fileExtension === "pdf" ? (
        // Full-screen iframe for PDF with full length
        <div 
          style={{ 
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 10000,
            backgroundColor: "white"
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              closePreviewModal();
            }
          }}
          tabIndex={0}
        >
          {/* Header with close button */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "50px",
              backgroundColor: "#f8f9fa",
              borderBottom: "1px solid #dee2e6",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 20px",
              zIndex: 10001,
            }}
          >
            <span style={{ fontSize: "16px", fontWeight: "500" }}>
              {previewFile.name || "PDF Document"}
            </span>
            <div>
              <button
                onClick={() => window.open(previewFile.secureUrl, '_blank')}
                style={{
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  marginRight: "10px",
                }}
              >
                Open in New Tab
              </button>
              <button
                onClick={closePreviewModal}
                style={{
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Close
              </button>
            </div>
          </div>

          {/* Full-length iframe for PDF */}
          <iframe
            src={previewFile.secureUrl}
            width="100%"
            height="100%"
            style={{ 
              border: "none",
              marginTop: "50px",
              height: "calc(100vh - 50px)"
            }}
            title="PDF Viewer - Full Length"
            onError={(e) => {
              message.error("Failed to load PDF. Please try opening in a new tab.");
            }}
          />
        </div>
      ) : (
        <Modal
          visible={!!previewFile && previewFile.fileExtension !== "pdf"}
          title={null}
          footer={null}
          onCancel={closePreviewModal}
          centered={!isFullscreen}
          bodyStyle={{ padding: 0, background: "linear-gradient(135deg, #1f2937, #111827)" }}
          width={isFullscreen ? "100%" : "95%"}
          style={{ 
            maxWidth: isFullscreen ? "100%" : "1200px",
            height: isFullscreen ? "100vh" : "auto",
            top: isFullscreen ? 0 : undefined,
            borderRadius: isFullscreen ? "0px" : "16px",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
          }}
          closable={false}
          mask={!isFullscreen}
          maskStyle={isFullscreen ? { display: 'none' } : undefined}
          className="enhanced-preview-modal"
        >
        {/* PDFs are handled outside modal, so this section is for non-PDF files only */}
        {previewFile?.isYouTube ? (
          // YouTube video iframe with AKJ overlay - Clean structure matching free player
          <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-lg overflow-hidden">
            <div className="youtube-overlay-container relative w-full overflow-hidden" style={{ 
              paddingBottom: isFullscreen ? "0" : "56.25%",
              minHeight: isFullscreen ? "100vh" : "60vh",
              maxHeight: isFullscreen ? "100vh" : "80vh",
              height: isFullscreen ? "100vh" : "auto"
            }}>
              <iframe
                src={previewFile.secureUrl}
                className="absolute inset-0 w-full h-full object-cover"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={previewFile.name || "Video Player"}
                style={{
                  borderRadius: isFullscreen ? "0px" : "8px",
                  background: "linear-gradient(135deg, #1f2937, #111827)"
                }}
              />
              
              {/* Secondary AKJ Branding - Bottom Right (covers YouTube logo) */}
              <div className="absolute bottom-2 right-2 z-15 bg-gradient-to-r from-blue-600/80 to-blue-700/80 rounded-lg px-3 py-1.5 shadow-lg backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-xs">A</span>
                  </div>
                  <span className="text-white text-xs font-semibold">AKJ</span>
                </div>
              </div>
              
              {/* Hide YouTube Controls Overlay - Bottom Right Corner */}
              <div className="youtube-brand-overlay bottom-0 right-0 w-28 h-14"></div>
              
              {/* Hide YouTube Logo Overlay - Top Right */}
              <div className="youtube-brand-overlay top-0 right-0 w-32 h-12"></div>
              
              {/* Hide YouTube Title Overlay - Full Top Bar */}
              <div className="absolute top-0 left-0 w-full h-20 bg-black z-18 pointer-events-none"></div>
              
              {/* Single Main AKJ Branding - Top Left (avoid overlap with controls) */}
              <div className="absolute top-3 left-3 z-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl px-4 py-3 shadow-xl backdrop-blur-sm border border-white/30">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-blue-600 font-bold text-lg">A</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white text-sm font-bold truncate max-w-xs">{previewFile?.name || "AKJ Video"}</span>
                    <span className="text-blue-200 text-xs font-medium">AKJ Classes • Premium Learning</span>
                  </div>
                </div>
              </div>
              
              {/* Control buttons - Top Right Corner */}
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
                  onClick={closePreviewModal}
                  className="w-12 h-12 bg-red-600/80 hover:bg-red-700/90 rounded-full flex items-center justify-center transition-colors duration-200 text-white shadow-lg border-2 border-white/20"
                  title="Close Video"
                >
                  <CloseOutlined style={{ fontSize: '18px' }} />
                </button>
              </div>
              
            </div>
          </div>
        ) : previewFile?.fileExtension && ["mp4", "webm", "mkv", "avi", "mov"].includes(previewFile.fileExtension) ? (
          <div className="relative bg-black rounded-b-lg overflow-hidden">
            <div className="relative" style={{ 
              paddingBottom: isFullscreen ? "0" : "56.25%",
              height: isFullscreen ? "100vh" : "auto"
            }}>
              <video
                src={previewFile?.secureUrl}
                controls
                controlsList="nodownload noremoteplayback"
                disablePictureInPicture
                className="absolute inset-0 w-full h-full object-contain"
                style={{
                  minHeight: "400px",
                  maxHeight: "70vh"
                }}
                onError={(e) => {
                  message.error("Video playback failed. The file might be corrupted or unsupported.");
                }}
              />
              
              {/* Control buttons - Top Right */}
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
                  onClick={closePreviewModal}
                  className="w-12 h-12 bg-red-600/80 hover:bg-red-700/90 rounded-full flex items-center justify-center transition-colors duration-200 text-white shadow-lg border-2 border-white/20"
                  title="Close Video"
                >
                  <CloseOutlined style={{ fontSize: '18px' }} />
                </button>
              </div>
              
              {/* Video Title Overlay - Top Left */}
              <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-60 rounded-lg px-3 py-2 text-white text-sm max-w-md">
                <div className="flex items-center space-x-2">
                  <FaPlay className="w-3 h-3 text-blue-400" />
                  <span className="truncate">{previewFile?.name || "Video"}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center bg-gray-50">
            <div className="flex flex-col items-center justify-center">
              {previewFile && (() => {
                const { icon: FileIcon, color } = getFileIcon(previewFile.name, previewFile.url, previewFile.type);
                return <FileIcon className="text-6xl mb-4" style={{ color, opacity: 0.5 }} />;
              })()}
              <h3 className="text-lg font-medium text-gray-800 mb-2">Preview not available</h3>
              <p className="text-gray-600 mb-6">File preview is not supported for this file type.</p>
              <div className="flex space-x-3">
                <Button 
                  type="primary" 
                  icon={<FaDownload />}
                  onClick={() => {
                    if (previewFile?.secureUrl) {
                      window.open(previewFile.secureUrl, '_blank');
                    }
                  }}
                >
                  Download File
                </Button>
                <Button onClick={closePreviewModal}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
        </Modal>
      )}
    </div>
  );
};
