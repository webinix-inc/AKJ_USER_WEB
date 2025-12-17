// src/components/AllFreeCourse.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import api from "../../api/axios";
import HOC from "../HOC/HOC";

const AllFreeCourse = () => {
  const [batches, setBatches] = useState([]);
  const navigate = useNavigate(); // Initialize the navigate function

  const fetchBatches = async () => {
    try {
      const response = await api.get("admin/freeCourse");
      setBatches(response.data);
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const openVideo = (videoUrl) => {
    const videoId = getYouTubeVideoId(videoUrl); // Get the video ID from the URL
    if (videoId) {
      navigate(`/video/${videoId}`); // Navigate to the VideoPlayer route
    } else {
      console.error("Invalid video URL");
    }
  };

  return (
    <div className="home4 p-4">
      <BatchList batchData={batches} openVideo={openVideo} />
    </div>
  );
};

function BatchList({ batchData, openVideo }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {batchData.length > 0 ? (
        batchData.map((batch, index) => (
          <BatchCard key={index} batch={batch} openVideo={openVideo} />
        ))
      ) : (
        <p>No batches available.</p>
      )}
    </div>
  );
}

function BatchCard({ batch, openVideo }) {
  const { title, description, videoSrc } = batch;
  const videoId = getYouTubeVideoId(videoSrc);
  const videoThumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const fallbackThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <div
      className="w-full h-[400px] bg-white border border-gray-300 rounded-lg p-4 flex flex-col cursor-pointer"
      onClick={() => openVideo(videoSrc)} // Update to openVideo
    >
      <img
        src={videoThumbnail}
        alt={title}
        className="mb-2 rounded-lg h-40 object-cover transition-opacity duration-300"
        loading="lazy"
        onError={(e) => {
          if (e.target.src.includes('maxresdefault')) {
            e.target.src = fallbackThumbnail;
          }
        }}
        onLoad={(e) => {
          e.target.style.opacity = '1';
        }}
        style={{ 
          opacity: '0', 
          backgroundColor: '#f3f4f6'
        }}
      />
      <h5 className="font-bold text-lg truncate">{title}</h5>
      <p className="text-gray-600 mt-2 line-clamp-3">{description}</p>
    </div>
  );
}

function getYouTubeVideoId(videoUrl) {
  const regex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:watch\?v=|embed\/|v\/|.+\?v=)?([^&\n]+)|youtu\.be\/([^&\n]+)/;
  const matches = videoUrl.match(regex);
  return matches ? matches[1] || matches[2] : null;
}

export default HOC(AllFreeCourse);
