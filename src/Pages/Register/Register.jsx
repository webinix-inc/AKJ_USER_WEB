import React, { useState } from "react";
import "./Register.css";
import "react-phone-input-2/lib/style.css";
import PhoneInput from "react-phone-input-2";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../Context/UserContext";
import { toast } from "react-toastify";
import { Input } from "antd";
import { validatePhoneNumber } from "../../utils/security";
import { ERROR_MESSAGES } from "../../utils/constants";
import NavbarLanding from "../Landing Page/NavbarLanding";

// Lazy load image to improve initial bundle size
// const img = "../../Image2/img12.png"; // Use as URL instead of import
import img from "../../Image2/img12.png";

const Register = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const { registerUser, loading } = useUser();
  const navigate = useNavigate();

  const handleRegister = async () => {
    // Prevent multiple submissions
    if (loading) {
      console.log(
        "Registration already in progress, ignoring duplicate request"
      );
      return;
    }

    // Enhanced validation
    if (!firstName || !lastName || !phone) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (!validatePhoneNumber(phone)) {
      toast.error(ERROR_MESSAGES.INVALID_PHONE);
      return;
    }

    // Debug logging
    console.log("📝 Registration attempt:", {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      phoneLength: phone.length,
    });

    try {
      const response = await registerUser({ firstName, lastName, phone });
      console.log("✅ Registration successful:", response);

      if (response && response.data) {
        toast.success("Registration successful! OTP: " + response.data.otp);
        const userId = response.data.id;
        navigate("/otpverify", { state: { userId, isSignup: true } });
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Registration error details:", error);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);

      let errorMessage = "Registration failed. Please try again.";

      // Handle specific error types
      if (error.type === "USER_EXISTS") {
        errorMessage =
          "User with this phone number already exists. Redirecting to login...";
        toast.error(errorMessage);
        console.log("🔄 Redirecting to login page for existing user");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
        return;
      } else if (error.response?.status === 409) {
        // Handle 409 directly - user already exists
        errorMessage =
          "User with this phone number already exists. Redirecting to login...";
        toast.error(errorMessage);
        console.log("🔄 409 Conflict - Redirecting to login page");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
        return;
      } else if (error.type === "NETWORK_ERROR") {
        errorMessage = error.message;
      } else if (error.type === "SERVER_ERROR") {
        errorMessage = error.message;
      } else if (error.response?.status >= 500) {
        errorMessage =
          error.message || "Server error occurred. Please try again later.";

        // If the error message indicates partial success, still try to proceed
        if (
          error.message &&
          error.message.includes("Registration successful but")
        ) {
          toast.warning(errorMessage);
          // Try to extract user data from error response if available
          if (error.response?.data?.data?.id) {
            console.log(
              "🔄 Partial success - proceeding with OTP verification"
            );
            const userId = error.response.data.data.id;
            const otp = error.response.data.data.otp;
            if (otp) {
              toast.success("OTP: " + otp);
            }
            navigate("/otpverify", { state: { userId, isSignup: true } });
            return;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
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
      <div className="pt-20 pb-8 flex flex-col items-center justify-center min-h-screen">
        <div className="flex flex-col md:flex-row card-apple rounded-apple-2xl shadow-apple-lg overflow-hidden w-full max-w-6xl mx-4 my-4">
          {/* Left Side - Hero Section */}
          <div className="relative h-auto w-full md:w-1/2 flex flex-col items-center justify-center gradient-apple-accent min-h-[500px] md:min-h-[600px]">
            <div className="text-center text-white p-6 md:p-8 animate-apple-slide-up">
              <h2 className="app-title text-white mb-4">Join Us Today!</h2>
              <p className="app-body text-orange-100 mb-6 md:mb-8">
                Start your learning journey with expert guidance
              </p>
              <div className="w-20 h-1 bg-white/50 rounded-full mx-auto"></div>
            </div>

            <div className="flex-1 flex items-center justify-center w-full p-4 md:p-8">
              <img
                src={img}
                alt="Registration"
                className="w-full max-w-lg object-contain opacity-90 animate-apple-fade-in"
              />
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="w-full md:w-1/2 p-8 flex flex-col justify-center items-center">
            <div className="text-center mb-8 w-full max-w-md animate-apple-slide-up">
              <h3 className="app-title text-brand-primary mb-3">
                Create Account
              </h3>
              <p className="app-body text-apple-gray-600">
                Already Have an Account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-brand-accent font-semibold hover:text-brand-accent-dark transition-colors duration-200"
                >
                  Sign In
                </button>
              </p>
            </div>

            <div className="w-full flex flex-col items-center gap-6 mb-8 max-w-md animate-apple-fade-in">
              <div className="w-full">
                <label className="block app-caption font-medium text-brand-primary mb-2">
                  First Name
                </label>
                <Input
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-apple w-full h-12"
                  style={{
                    fontSize: "16px",
                    fontFamily:
                      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
                  }}
                />
              </div>
              <div className="w-full">
                <label className="block app-caption font-medium text-brand-primary mb-2">
                  Last Name
                </label>
                <Input
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-apple w-full h-12"
                  style={{
                    fontSize: "16px",
                    fontFamily:
                      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
                  }}
                />
              </div>
              <div className="w-full">
                <label className="block app-caption font-medium text-brand-primary mb-2">
                  Mobile Number
                </label>
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
              <div className="card-apple-info p-4 w-full border-l-4 border-brand-accent">
                <p className="app-caption text-brand-primary font-medium flex items-center">
                  <span className="mr-2">📱</span>
                  We'll send an OTP for secure verification
                </p>
              </div>
            </div>

            <div className="w-full flex justify-center mb-6 max-w-md">
              <button
                className={`btn-apple-accent w-full py-4 text-base font-semibold transition-all duration-300 ${
                  loading ? "opacity-50 cursor-not-allowed" : "hover-lift"
                }`}
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>

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

export default Register;
