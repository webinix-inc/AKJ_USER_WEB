import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChalkboardTeacher,
  FaBook,
  FaUserGraduate,
  FaUniversity,
} from "react-icons/fa";
import { useCourseContext } from "../../Context/CourseContext";
import api from "../../api/axios";

const Startlearning = () => {
  const navigate = useNavigate();
  const { courses, fetchCourses, loading, error } = useCourseContext();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    courseName: "",
    description: "",
  });

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleStartNowClick = async () => {
    try {
      const response = await api.post("/enquiries", formData);
      setFormData({ fullName: "", email: "", courseName: "", description: "" });
      alert(response.data.message);
    } catch (error) {
      console.error("Error submitting enquiry:", error);
      alert("Error submitting enquiry. Please try again.");
    }
  };

  const course = [
    {
      name: "IIT-JEE",
      icon: <FaUniversity className="text-5xl sm:text-6xl mb-2 text-green-500" />,
    },
    {
      name: "NEET",
      icon: <FaBook className="text-5xl sm:text-6xl mb-2 text-green-500" />,
    },
    {
      name: "Olympoid",
      icon: <FaChalkboardTeacher className="text-5xl sm:text-6xl mb-2 text-green-500" />,
    },
    {
      name: "Foundation",
      icon: <FaUserGraduate className="text-5xl sm:text-6xl mb-2 text-green-500" />,
    },
  ];

  return (
    <div className="w-full max-w-[1300px] mx-auto px-2 sm:px-4 lg:px-6 space-y-16">
      {/* Find Your Courses Section */}
      <div className="w-full flex flex-col lg:flex-row bg-gradient-to-r from-[#023d50] to-[#0086b2] text-white p-8 lg:p-12 rounded-2xl gap-8 lg:gap-12">
        {/* Left Content */}
        <div className="flex-1 lg:pr-8">
          <h2 className="text-3xl lg:text-4xl text-[#fc9721] font-bold mb-4">
            Find Your Courses
          </h2>
          <p className="text-base lg:text-lg mt-6 leading-relaxed">
            Discover a range of courses tailored to your interests and goals. Whether you're looking to enhance your skills or start a new journey, we have something for everyone.
          </p>
        </div>

        {/* Right Form */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Inputs */}
            <div className="flex flex-col w-full md:w-1/2 space-y-4">
              <input
                type="text"
                name="fullName"
                placeholder="Full Name*"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className="w-full p-3 text-base rounded-lg outline-none text-gray-800 border-2 border-transparent focus:border-[#fc9721] transition-colors"
              />
              <input
                type="email"
                name="email"
                placeholder="Enter your email*"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full p-3 text-base rounded-lg outline-none text-gray-800 border-2 border-transparent focus:border-[#fc9721] transition-colors"
              />
              <select
                name="courseName"
                value={formData.courseName}
                onChange={handleInputChange}
                required
                className="w-full p-3 text-base rounded-lg outline-none text-gray-800 border-2 border-transparent focus:border-[#fc9721] transition-colors"
              >
                <option value="">Select Course</option>
                {loading ? (
                  <option>Loading courses...</option>
                ) : error ? (
                  <option>Error loading courses</option>
                ) : (
                  courses?.map((course) => (
                    <option key={course.id} value={course.name}>
                      {course.title}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Right Textarea + Button */}
            <div className="flex flex-col w-full md:w-1/2 space-y-4">
              <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleInputChange}
                required
                className="w-full p-3 text-base rounded-lg outline-none text-gray-800 border-2 border-transparent focus:border-[#fc9721] transition-colors flex-grow"
                rows={6}
              ></textarea>

              <button
                onClick={handleStartNowClick}
                className="bg-[#fc9721] hover:bg-[#ff953a] text-white p-3 font-bold text-base rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Enquire Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Explore Category Section */}
      <div className="w-full">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-[#023d50] mb-4">
            Explore Your <span className="text-[#fc9721]">Category</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#fc9721] to-[#ff953a] rounded-full mx-auto"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {course.map((course, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 lg:p-8 flex flex-col items-center justify-center text-gray-800 font-bold border-2 border-gray-200 shadow-lg hover:shadow-xl hover:border-[#fc9721] transition-all duration-300 cursor-pointer transform hover:-translate-y-2 min-h-[200px] lg:min-h-[240px]"
              onClick={() => navigate("/explorecourses")}
            >
              <div className="mb-4 text-[#0086b2]">
                {React.cloneElement(course.icon, { className: "text-6xl lg:text-7xl" })}
              </div>
              <h3 className="text-lg lg:text-xl text-center text-[#023d50]">{course.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Startlearning;
