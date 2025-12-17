import React from "react";
import "./ExploreCourses.css";
import Batches from "../../Components/Course/Batches";
import { useNavigate } from "react-router-dom";
import "swiper/css";
import HOC from "../../Components/HOC/HOC";
import NavbarLanding from "../Landing Page/NavbarLanding";
import { useUser } from "../../Context/UserContext";

const ExploreCourses = () => {
  return (
    <div className="w-full min-h-screen font-apple" style={{background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #f0f0f0 100%)'}}>
      <div className="w-full">
        <Batches />
      </div>
    </div>
  );
};

const ExploreCoursesWithHOC = HOC(ExploreCourses);

const ConditionalExploreCourses = () => {
  const { isAuthenticated } = useUser();

  console.log('🔍 ExploreCourses - Authentication status:', isAuthenticated);

  if (isAuthenticated) {
    console.log('✅ User is authenticated, showing HOC version');
    return <ExploreCoursesWithHOC />;
  } else {
    console.log('❌ User is not authenticated, showing public version');
    return (
      <div className="w-full min-h-screen">
        <NavbarLanding />
        <ExploreCourses />
      </div>
    );
  }
};

export default ConditionalExploreCourses;
