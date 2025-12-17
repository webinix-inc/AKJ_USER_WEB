import React, { useEffect, useState } from "react";
import { logServerStatus } from "../../utils/serverConfig";

const PDFViewer = ({ fileUrl }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [useDirectPDF, setUseDirectPDF] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();

      // Block print, save, view source, select all, copy, paste, DevTools
      if (
        (e.ctrlKey || e.metaKey) &&
        ["p", "s", "u", "a", "c", "v"].includes(key)
      ) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Block DevTools (F12, Ctrl+Shift+I/J/C)
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(key))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault(); // Disable right-click
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  const handleIframeLoad = () => {
    // Add a delay to ensure PDF.js has fully loaded
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleIframeError = () => {
    console.error("PDF viewer failed to load, attempt:", retryCount + 1);
    
    if (retryCount < 2) {
      // Try reloading the iframe
      setRetryCount(prev => prev + 1);
      setLoading(true);
      
      // Force reload after a short delay
      setTimeout(() => {
        const iframe = document.querySelector('iframe[title="PDF Viewer"]');
        if (iframe) {
          iframe.src = iframe.src; // Force reload
        }
      }, 1000);
    } else {
      // After 2 retries, switch to direct PDF viewing
      console.log("Switching to direct PDF viewer");
      setUseDirectPDF(true);
      setLoading(false);
    }
  };

  // Fallback to browser's native PDF viewer if PDF.js fails
  const openInBrowserViewer = () => {
    window.open(fileUrl, '_blank');
  };

  // Check if we should use direct PDF viewing
  useEffect(() => {
    // Check server configuration and PDF.js availability
    const checkPDFJS = async () => {
      try {
        // Run server configuration check
        const { checks, recommendations } = await logServerStatus();
        
        // If critical issues are found, use direct PDF viewer
        if (!checks.pdfjs || !checks.worker) {
          console.warn('PDF.js not properly configured, using direct PDF viewer');
          setUseDirectPDF(true);
          setLoading(false);
          return;
        }

        // If MIME types are wrong, still try but with fallback ready
        if (!checks.mimeTypes) {
          console.warn('MIME type issues detected, PDF.js may fail');
        }

      } catch (error) {
        console.warn('Server configuration check failed, using direct PDF viewer:', error);
        setUseDirectPDF(true);
        setLoading(false);
      }
    };

    checkPDFJS();
  }, []);

  // If we're using direct PDF viewing or there's an error
  if (useDirectPDF || error) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 9999,
          backgroundColor: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "500px" }}>
          <h2 style={{ color: useDirectPDF ? "#28a745" : "#dc3545", marginBottom: "20px" }}>
            {useDirectPDF ? "Direct PDF Viewer" : "PDF Viewer Error"}
          </h2>
          <p style={{ marginBottom: "20px", color: "#666" }}>
            {useDirectPDF 
              ? "Using browser's native PDF viewer for better compatibility."
              : "The PDF viewer encountered an error. You can try opening the PDF in a new tab."
            }
          </p>
          <button
            onClick={openInBrowserViewer}
            style={{
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
              marginRight: "10px",
            }}
          >
            Open in New Tab
          </button>
          <button
            onClick={() => window.history.back()}
            style={{
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
        backgroundColor: "white",
      }}
    >
      {loading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            zIndex: 10000,
          }}
        >
          <div
            style={{
              width: "50px",
              height: "50px",
              border: "3px solid #f3f3f3",
              borderTop: "3px solid #007bff",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px",
            }}
          />
          <p>Loading PDF...</p>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}
      {useDirectPDF ? (
        <iframe
          src={fileUrl}
          width="100%"
          height="100%"
          style={{ border: "none" }}
          title="Direct PDF Viewer"
          onLoad={() => setLoading(false)}
        />
      ) : (
        <iframe
          tabIndex="0"
          src={`/pdfjs/web/viewer.html?file=${encodeURIComponent(
            fileUrl
          )}&disableDownload=true&disablePrint=true`}
          width="100%"
          height="100%"
          style={{ border: "none" }}
          title="PDF Viewer"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      )}
    </div>
  );
};

export default PDFViewer;
