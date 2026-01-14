import React, { useState, useEffect } from "react";
import "./Register.css";
import img from "../../Image2/img12.png";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../Context/UserContext.js";
import NavbarLanding from "../Landing Page/NavbarLanding";

const OTPVerify = () => {
  const [otp, setOtp] = useState(new Array(4).fill(""));
  const [timer, setTimer] = useState(60);
  const [isResendAllowed, setIsResendAllowed] = useState(false);
  const { verifyOTP, resendOTP, loading, sendWelcomeMessage } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;

  const isSignup = location.state?.isSignup || false;

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setIsResendAllowed(true);
    }
  }, [timer]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleSubmit = async () => {
    const otpCode = otp.join("");
    try {
      const data = await verifyOTP(userId, otpCode);
      if (isSignup) {
        await sendWelcomeMessage(userId);
        navigate("/home", { state: { userId, signup: true } });
      } else {
        navigate("/home");
      }
    } catch (error) {
      console.error("Error during OTP verification:", error);
    }
  };

  const handleResend = async () => {
    try {
      await resendOTP(userId);
      setTimer(60);
      setIsResendAllowed(false);
    } catch (error) {
      console.error("Error during OTP resend:", error);
    }
  };

  return (
    <div
      className="min-h-screen font-apple"
      style={{
        background:
          "linear-gradient(135deg, #fafafa 0%, #f5f5f5 50%, #f0f0f0 100%)",
      }}
    >
      {/* Landing Page Navbar */}
      <NavbarLanding />

      {/* Main Content with padding for fixed navbar */}
      <div className="pt-20 pb-8 flex flex-col md:flex-row items-center justify-center min-h-screen">
        <div className="flex flex-col md:flex-row card-apple rounded-apple-2xl shadow-apple-lg overflow-hidden w-full max-w-6xl mx-4 my-4">
          {/* Left Side - Hero Section */}
          <div className="relative h-auto w-full md:w-1/2 flex flex-col items-center justify-center gradient-apple-accent min-h-[400px] md:min-h-[600px]">
            <div className="text-center text-white p-6 md:p-8 animate-apple-slide-up">
              <h2 className="app-title text-white mb-4">Verify Your Account</h2>
              <p className="app-body text-orange-100 mb-6 md:mb-8">
                Enter the code sent to your phone
              </p>
              <div className="w-20 h-1 bg-white/50 rounded-full mx-auto"></div>
            </div>

            <div className="flex-1 flex items-center justify-center w-full p-4 md:p-8">
              <img
                src={img}
                alt="OTP Verification"
                className="w-full max-w-lg object-contain opacity-90 animate-apple-fade-in"
              />
            </div>
          </div>

          {/* Right Side - OTP Form */}
          <div className="w-full md:w-1/2 p-6 md:p-8 lg:p-10 flex flex-col justify-center items-center bg-white">
            <div className="text-center mb-6 w-full max-w-md animate-apple-slide-up">
              <h3 className="app-title text-brand-primary mb-3">
                {isSignup ? "Join Expert Learning" : "Welcome Back"}
              </h3>
              <p className="app-body text-apple-gray-600">
                {!isSignup && (
                  <>
                    Already Have an Account?{" "}
                    <button
                      onClick={() => navigate("/login")}
                      className="text-brand-accent font-semibold hover:text-brand-accent-dark transition-colors duration-200"
                    >
                      Login
                    </button>
                  </>
                )}
              </p>
            </div>

            <div className="text-center mb-6 w-full max-w-md">
              <p className="app-body text-apple-gray-600">
                Enter the 4-digit OTP code sent to your phone
              </p>
            </div>

            {/* OTP Input Container */}
            <div className="w-full flex justify-center mb-6 max-w-md">
              <div className="otp-container">
                {otp.map((data, index) => (
                  <input
                    className="otp-input"
                    type="text"
                    name="otp"
                    maxLength="1"
                    key={index}
                    value={data}
                    placeholder="0"
                    onChange={(e) => handleChange(e.target, index)}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !data && index > 0) {
                        e.target.previousSibling?.focus();
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Verify Button */}
            <div className="w-full flex justify-center mb-4 max-w-md">
              <button
                className={`btn-apple-primary w-full py-4 text-base font-semibold transition-all duration-300 ${
                  loading ? "opacity-50 cursor-not-allowed" : "hover-lift"
                }`}
                onClick={handleSubmit}
                disabled={loading || otp.join("").length !== 4}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  "Verify OTP"
                )}
              </button>
            </div>

            {/* Resend OTP */}
            <div className="text-center app-caption text-apple-gray-600 mb-6 max-w-md">
              {isResendAllowed ? (
                <button
                  onClick={handleResend}
                  className="text-brand-accent font-semibold hover:text-brand-accent-dark transition-colors duration-200 hover:underline"
                >
                  Resend OTP
                </button>
              ) : (
                <p>
                  Resend OTP in{" "}
                  <span className="font-semibold text-brand-primary">
                    00:{timer.toString().padStart(2, "0")}
                  </span>{" "}
                  Sec
                </p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="text-center app-caption text-apple-gray-500 max-w-md animate-apple-slide-up">
              <p className="leading-relaxed">
                By signing up, you agree to our{" "}
                <button className="text-apple-blue-500 hover:text-apple-blue-600 transition-colors duration-200 hover:underline">
                  Terms & Conditions
                </button>{" "}
                and{" "}
                <button className="text-apple-blue-500 hover:text-apple-blue-600 transition-colors duration-200 hover:underline">
                  Privacy Policy
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerify;
