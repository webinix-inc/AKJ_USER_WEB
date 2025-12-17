import React from "react";
import "./NoticeOverview.css";
import HOC from "../../Components/HOC/HOC";

const NoticeOverview = () => {

  const noticeData = [
    {
      id: 1,
      title: "NET-JRF Notification: Important Details",
      description: "The NET-JRF exam is scheduled for December 15, 2024. Please prepare accordingly.",
      time: "3:20 PM",
      image: "img43.png"
    },
    {
      id: 2,
      title: "NET-JRF Application Deadline Approaches",
      description: "The deadline for NET-JRF applications is November 30, 2024. Ensure timely submission.",
      time: "2:15 PM",
      image: "img43.png"
    },
    {
      id: 3,
      title: "NET-JRF Admit Card Availability Date",
      description: "Admit cards will be available from December 1, 2024. Download them from the portal.",
      time: "10:00 AM",
      image: "img43.png"
    },
    {
      id: 4,
      title: "NET-JRF Exam Pattern Update Notice",
      description: "The exam pattern has been updated. Visit the website for details on changes.",
      time: "1:00 PM",
      image: "img43.png"
    },
    {
      id: 5,
      title: "NET-JRF Mock Test Scheduled Online",
      description: "A mock test will be held online on December 10, 2024. Register to participate.",
      time: "11:30 AM",
      image: "img43.png"
    },
    {
      id: 6,
      title: "NET-JRF Result Declaration Date",
      description: "Results will be declared on January 15, 2025. Check the website for updates.",
      time: "4:00 PM",
      image: "img43.png"
    },
    {
      id: 7,
      title: "NET-JRF Counseling Sessions Start",
      description: "Counseling will begin from February 1, 2025. Details will be provided soon.",
      time: "9:00 AM",
      image: "img43.png"
    },
    {
      id: 8,
      title: "NET-JRF Eligibility Criteria Revised",
      description: "Eligibility criteria have been revised. Refer to the latest notice for information.",
      time: "12:00 PM",
      image: "img43.png"
    },
    {
      id: 9,
      title: "NET-JRF Scholarship Program Announcement",
      description: "A new scholarship program will start from March 2025. Details will be available soon.",
      time: "2:30 PM",
      image: "img43.png"
    },
    {
      id: 10,
      title: "NET-JRF Study Material Updated",
      description: "Updated study materials are available for download on the official website. Check now.",
      time: "5:00 PM",
      image: "img43.png"
    },
    {
      id: 11,
      title: "NET-JRF Application Form Correction Dates",
      description: "Correction facility for application forms will be open from November 20-25, 2024.",
      time: "8:00 AM",
      image: "img43.png"
    },
    {
      id: 12,
      title: "NET-JRF Test Series Begins Soon",
      description: "Test series for NET-JRF starts on November 15, 2024. Join to assess your preparation.",
      time: "7:00 PM",
      image: "img43.png"
    },
    {
      id: 13,
      title: "NET-JRF Exam Venue Change Notice",
      description: "There are changes in exam venues. Verify your updated venue on the admit card.",
      time: "6:00 PM",
      image: "img43.png"
    },
    {
      id: 14,
      title: "NET-JRF Live FAQs Session Scheduled",
      description: "A live session to address FAQs will be held on November 25, 2024. Join to clarify doubts.",
      time: "3:00 PM",
      image: "img43.png"
    },
    {
      id: 15,
      title: "NET-JRF Previous Years’ Question Papers",
      description: "Previous years’ question papers are now available. Download them from the official website.",
      time: "11:00 AM",
      image: "img43.png"
    },
  ];

  return (
    <div className="noticeoverview">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#023d50] mb-2">Important Notices</h2>
        <div className="w-20 h-1 bg-gradient-to-r from-[#fc9721] to-[#ff953a] rounded-full"></div>
      </div>
      <div className="noticeoverview1">
        {noticeData.map((notice) => (
          <div key={notice.id} className="noticeoverview2">
            <div className="noticeoverview3">
              <span className="text-white text-xl">📢</span>
            </div>
            <div className="noticeoverview4">
              <h6>{notice.title}</h6>
              <p>{notice.description}</p>
            </div>
            <div className="noticeoverview5">
              <p>{notice.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HOC(NoticeOverview);
