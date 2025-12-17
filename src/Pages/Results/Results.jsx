import React, { useState, useEffect } from "react";
import "./Results.css";
import HOC from "../../Components/HOC/HOC";
import img from "../../Image2/img41.jpeg";
import { HiDownload } from "react-icons/hi";
import { saveAs } from "file-saver";

const dummyResults = [
  {
    id: 1,
    title: "Achievement Unlocked",
    description: "Congratulations! You've reached a new milestone in your journey. Your dedication and hard work have paid off, and we're excited to celebrate this success with you.",
    time: "10:00 AM",
    image: img,
    fileUrl: "https://drive.google.com/uc?export=download&id=1f40bIXU4VtYKS4vhPTJBqUELP5mbBh1b"
  },
  {
    id: 2,
    title: "Goal Accomplished",
    description: "Fantastic job on achieving your goal! This accomplishment reflects your commitment and perseverance. Keep up the great work as you continue to achieve even more.",
    time: "11:30 AM",
    image: img,
    fileUrl: "https://drive.google.com/uc?export=download&id=1f40bIXU4VtYKS4vhPTJBqUELP5mbBh1b"
  },
  {
    id: 3,
    title: "Milestone Reached",
    description: "You've reached an important milestone in your journey. This is a significant achievement that showcases your skills and determination. Well done!",
    time: "1:45 PM",
    image: img,
    fileUrl: "https://drive.google.com/uc?export=download&id=1f40bIXU4VtYKS4vhPTJBqUELP5mbBh1b"
  },
  {
    id: 4,
    title: "Success Story",
    description: "Your hard work has resulted in a remarkable success story. This achievement is a testament to your efforts and dedication. We're proud of what you've accomplished!",
    time: "3:30 PM",
    image: img,
    fileUrl: "https://drive.google.com/uc?export=download&id=1f40bIXU4VtYKS4vhPTJBqUELP5mbBh1b"
  },
  {
    id: 5,
    title: "Inspiration Shared",
    description: "You've inspired others with your recent achievement. Your success serves as a beacon of motivation for those around you. Keep leading by example!",
    time: "5:00 PM",
    image: img,
    fileUrl: "https://drive.google.com/uc?export=download&id=1f40bIXU4VtYKS4vhPTJBqUELP5mbBh1b"
  }
];

const Results = () => {
  const [results, setResults] = useState([]);

  useEffect(() => {
    setResults(dummyResults);
  }, []);

  const handleDownload = (fileUrl) => {
    // Use the saveAs function from file-saver
    saveAs(fileUrl, "downloadedFile");
  };

  return (
    <div className="noticeoverview">
      <div className="home5">
        <h6>Results</h6>
      </div>
      <div className="noticeoverview1">
        {results.map((result) => (
          <div key={result.id} className="noticeoverview2">
            <div className="noticeoverview3">
              <img src={result.image} alt="Result" />
            </div>
            <div className="noticeoverview4">
              <h6>{result.title}</h6>
              <p>
                {result.description}
                <br />
                <br />
                {/* Any additional content */}
              </p>
            </div>
            <div className="noticeoverview5">
              <p>{result.time}</p>
              <div className="noticeoverview6">
                <HiDownload
                  color="#FFFFFF"
                  size={25}
                  onClick={() => handleDownload(result.fileUrl)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HOC(Results);
