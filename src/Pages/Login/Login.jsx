import React, { useState } from "react";
import "./Login.css";
import "react-phone-input-2/lib/style.css";
import PhoneInput from "react-phone-input-2";
import { useNavigate } from "react-router-dom";
import img from "../../Image2/img12.png";
import { useUser } from "../../Context/UserContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { validatePhoneNumber } from "../../utils/security";
import { ERROR_MESSAGES } from "../../utils/constants";
import NavbarLanding from "../Landing Page/NavbarLanding";

const Login = () => {
  const [phone, setPhone] = useState("");
  const { loginUser, loading } = useUser();
  const navigate = useNavigate();

  const handleLogin = async () => {
    // Enhanced validation
    if (!phone) {
      toast.error("Please enter a valid phone number");
      return;
    }

    if (!validatePhoneNumber(phone)) {
      toast.error(ERROR_MESSAGES.INVALID_PHONE);
      return;
    }

    try {
      const response = await loginUser(phone);
      const userId = response.data.id;
      const otp = response.data.otp;
      toast.success(`Login successful! OTP: ${otp}`);
      navigate("/otpverify", { state: { userId } });
    } catch (error) {
      let errorMessage = "Login failed. Please try again.";

      // Handle different error types from enhanced axios
      if (error.type === "NETWORK_ERROR") {
        errorMessage = error.message;
      } else if (error.type === "SERVER_ERROR") {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(`Error: ${errorMessage}`);
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
        {/* Left Side - Hero Section */}
        <div className="relative h-auto w-full md:w-1/2 flex flex-col items-center justify-center gradient-apple-primary rounded-apple-2xl md:rounded-l-2xl md:rounded-r-none min-h-[500px] md:min-h-[600px] mx-4 my-4">
          <div className="text-center p-6 md:p-8 animate-apple-slide-up">
            <h2 className="app-title text-apple-gray-800 mb-4">
              Welcome Back!
            </h2>
            <p className="app-body text-apple-gray-600 mb-6 md:mb-8">
              Continue your learning journey with us
            </p>
            <div className="w-20 h-1 gradient-apple-accent rounded-full mx-auto"></div>
          </div>

          <div className="flex-1 flex items-center justify-center w-full p-4 md:p-8">
            <img
              src={img}
              alt="Login"
              className="w-full max-w-lg object-contain opacity-90 animate-apple-fade-in"
            />
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-6 md:px-8 py-8 md:py-12 card-apple rounded-apple-2xl md:rounded-r-2xl md:rounded-l-none shadow-apple-lg mx-4 my-4">
          <div className="text-center mb-8 w-full max-w-md animate-apple-slide-up">
            <h3 className="app-title text-brand-primary mb-3">Sign In</h3>
            <p className="app-body text-apple-gray-600">
              Don't Have an Account?{" "}
              <button
                className="text-brand-accent font-semibold hover:text-brand-accent-dark transition-colors duration-200"
                onClick={() => navigate("/register")}
              >
                Sign Up
              </button>
            </p>
          </div>

          <div className="w-full flex flex-col items-center gap-6 mb-8 max-w-md animate-apple-fade-in">
            <div className="w-full">
              <label className="block app-caption font-medium text-brand-primary mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <PhoneInput
                  country={"in"}
                  value={phone}
                  placeholder="Enter Your Mobile Number"
                  onChange={(phone) => setPhone(phone)}
                  containerStyle={{ width: "100%" }}
                  inputStyle={{
                    width: "100%",
                    height: "48px",
                    borderRadius: "12px",
                    border: "1px solid #d1d5db",
                    fontSize: "16px",
                    paddingLeft: "60px",
                    fontFamily:
                      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
                    transition: "all 0.2s ease",
                  }}
                  buttonStyle={{
                    borderRadius: "12px 0 0 12px",
                    border: "1px solid #d1d5db",
                    borderRight: "none",
                    backgroundColor: "#f9fafb",
                  }}
                  dropdownStyle={{
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    border: "1px solid #e5e7eb",
                  }}
                />
              </div>
            </div>

            <div className="card-apple-info p-4 w-full border-l-4 border-apple-blue-400">
              <p className="app-caption text-brand-primary font-medium flex items-center">
                <span className="mr-2">📱</span>
                We'll send an OTP for secure verification
              </p>
            </div>
          </div>

          <div className="w-full flex justify-center mb-6 max-w-md">
            <button
              className={`btn-apple-primary w-full py-4 text-base font-semibold transition-all duration-300 ${
                loading ? "opacity-50 cursor-not-allowed" : "hover-lift"
              }`}
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Requesting...
                </div>
              ) : (
                "Request OTP"
              )}
            </button>
          </div>

          <div className="text-center app-caption text-apple-gray-500 max-w-md animate-apple-slide-up">
            <p className="leading-relaxed">
              By logging in, you agree to our{" "}
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
  );
};

export default Login;
