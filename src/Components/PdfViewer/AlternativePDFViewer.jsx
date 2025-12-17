import React, { useEffect, useState } from "react";

const AlternativePDFViewer = ({ fileUrl, onClose }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useNativeViewer, setUseNativeViewer] = useState(false);

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

      // Close on Escape
      if (e.key === "Escape") {
        onClose?.();
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
  }, [onClose]);

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    console.error("PDF.js viewer failed to load, switching to native viewer");
    setUseNativeViewer(true);
    setLoading(false);
  };

  const openInNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  if (useNativeViewer) {
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
        {/* Header with controls */}
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
          <span style={{ fontSize: "16px", fontWeight: "500" }}>PDF Viewer</span>
          <div>
            <button
              onClick={openInNewTab}
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
              onClick={onClose}
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

        {/* Native PDF viewer */}
        <iframe
          src={fileUrl}
          width="100%"
          height="100%"
          style={{ 
            border: "none", 
            marginTop: "50px",
            height: "calc(100vh - 50px)"
          }}
          title="PDF Viewer"
        />
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

      {/* Header with controls */}
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
        <span style={{ fontSize: "16px", fontWeight: "500" }}>PDF Viewer</span>
        <div>
          <button
            onClick={() => setUseNativeViewer(true)}
            style={{
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              marginRight: "10px",
            }}
          >
            Use Native Viewer
          </button>
          <button
            onClick={openInNewTab}
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
            onClick={onClose}
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

      <iframe
        tabIndex="0"
        src={`/pdfjs/web/viewer.html?file=${encodeURIComponent(
          fileUrl
        )}&disableDownload=true&disablePrint=true`}
        width="100%"
        height="100%"
        style={{ 
          border: "none",
          marginTop: "50px",
          height: "calc(100vh - 50px)"
        }}
        title="PDF Viewer"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    </div>
  );
};

export default AlternativePDFViewer;
