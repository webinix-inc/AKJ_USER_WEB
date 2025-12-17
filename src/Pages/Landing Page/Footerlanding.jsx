import React from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaTelegram,
  FaYoutube,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useCourseContext } from "../../Context/CourseContext";
import Image1 from "../../Image2/LOGO.jpeg";

const FooterLanding = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const { courses } = useCourseContext();

  const handleCourseClick = (courseId) => {
    navigate(`/explorecourses`);
  };

  return (
    <div className="bg-gradient-to-br from-[#023d50] to-[#0086b2] text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Company Info Section */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#fc9721] to-[#ff953a] rounded-2xl blur-lg opacity-30"></div>
                  <img className="relative h-16 w-16 rounded-2xl shadow-lg" src={Image1} alt="Logo" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">AKJ Classes</h2>
                  <p className="text-blue-200 text-sm">Since 1974 - Sign of Success</p>
                </div>
              </div>
              <p className="text-blue-100 leading-relaxed text-base max-w-lg">
                We understand that every student has different needs and capabilities, which is why we create such a wonderful and unique curriculum that is the best fit for every student.
              </p>
            </div>

            {/* App Store Buttons */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#fc9721] mb-4">Download Our App</h3>
              <div className="flex gap-4">
                <a
                  href="https://play.google.com/store/apps/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transform hover:scale-105 transition-transform duration-300"
                >
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 hover:bg-white/20 transition-all duration-300">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                      alt="Google Play"
                      className="h-10"
                    />
                  </div>
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transform hover:scale-105 transition-transform duration-300"
                >
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 hover:bg-white/20 transition-all duration-300">
                    <img
                      src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                      alt="App Store"
                      className="h-10"
                    />
                  </div>
                </a>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-lg font-semibold text-[#fc9721] mb-4">Connect With Us</h3>
              <div className="flex gap-4">
                <a
                  href="https://www.facebook.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 hover:bg-blue-600 hover:border-blue-600 transition-all duration-300 transform hover:scale-110"
                >
                  <FaFacebookF className="text-white text-lg" />
                </a>
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 hover:bg-pink-500 hover:border-pink-500 transition-all duration-300 transform hover:scale-110"
                >
                  <FaInstagram className="text-white text-lg" />
                </a>
                <a
                  href="https://www.youtube.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 hover:bg-red-500 hover:border-red-500 transition-all duration-300 transform hover:scale-110"
                >
                  <FaYoutube className="text-white text-lg" />
                </a>
                <a
                  href="https://telegram.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 hover:bg-blue-400 hover:border-blue-400 transition-all duration-300 transform hover:scale-110"
                >
                  <FaTelegram className="text-white text-lg" />
                </a>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xl font-bold text-[#fc9721] mb-6 flex items-center">
              <span className="mr-2">📍</span>
              Contact Us
            </h4>
            <div className="space-y-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-blue-100 text-sm leading-relaxed">
                  Green Lawns Apts, E, C 101/102, Aarey Rd, opp. St. Pius College, Jay Prakash Nagar, Goregaon, Mumbai, Maharashtra 400063
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-blue-100 text-sm flex items-center">
                  <span className="mr-2">📞</span>
                  +91-82918 21247 / +91-82918 21248
                </p>
                <p className="text-blue-100 text-sm flex items-center">
                  <span className="mr-2">🕒</span>
                  Hours: Closed ⋅ Opens 11 am Mon
                </p>
                <p className="text-blue-100 text-sm flex items-center">
                  <span className="mr-2">✉️</span>
                  contact@akjclasses.com
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xl font-bold text-[#fc9721] mb-6 flex items-center">
              <span className="mr-2">🔗</span>
              Quick Links
            </h4>
            <div className="space-y-6">
              {/* Explore Courses */}
              <div>
                <h5 className="text-white font-semibold mb-3">Explore Courses</h5>
                <ul className="space-y-2">
                  {courses && courses.length > 0 ? (
                    courses.slice(0, 4).map((course) => (
                      <li key={course.id}>
                        <button
                          className="text-blue-200 hover:text-[#fc9721] text-sm transition-colors duration-300 text-left"
                          onClick={() => handleCourseClick(course.id)}
                        >
                          • {course.title}
                        </button>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="text-blue-200 text-sm">• NEET</li>
                      <li className="text-blue-200 text-sm">• IIT JEE</li>
                      <li className="text-blue-200 text-sm">• JEE 2025</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Useful Links */}
              <div>
                <h5 className="text-white font-semibold mb-3">Useful Links</h5>
                <ul className="space-y-2">
                  <li>
                    <Link to="/about" className="text-blue-200 hover:text-[#fc9721] text-sm transition-colors duration-300">
                      • About Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/faq" className="text-blue-200 hover:text-[#fc9721] text-sm transition-colors duration-300">
                      • FAQ Questions
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy" className="text-blue-200 hover:text-[#fc9721] text-sm transition-colors duration-300">
                      • Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="text-blue-200 hover:text-[#fc9721] text-sm transition-colors duration-300">
                      • Contact Us
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 pt-8 border-t border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <p className="text-blue-100 text-sm">
                © {currentYear} AKJ Classes. All Rights Reserved.
              </p>
              <p className="text-blue-200 text-xs mt-1">
                Empowering students since 1974
              </p>
            </div>
            <div className="flex flex-wrap gap-6 justify-center">
              <Link to="/terms" className="text-blue-200 hover:text-[#fc9721] text-sm transition-colors duration-300">
                Terms & Conditions
              </Link>
              <Link to="/privacy" className="text-blue-200 hover:text-[#fc9721] text-sm transition-colors duration-300">
                Privacy Policy
              </Link>
              <Link to="/refund" className="text-blue-200 hover:text-[#fc9721] text-sm transition-colors duration-300">
                Refund Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FooterLanding;