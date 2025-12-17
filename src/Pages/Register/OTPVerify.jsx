import React, { useState, useEffect } from "react";
import "./Register.css";
import img from "../../Image2/img12.png";
import { CgCloseR } from "react-icons/cg";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../Context/UserContext.js";

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
    <div className="register min-h-screen flex flex-col md:flex-row items-center justify-center bg-white lg:mx-20">
      <div className="register2 relative h-auto w-full md:w-1/2 flex flex-col items-center justify-center bg-gray-100">
        <div className="register222 absolute top-4 right-4">
          <CgCloseR
            color="#023D50"
            size={30}
            onClick={() => navigate("/")}
            className="cursor-pointer"
          />
        </div>
        <img
          src={img}
          alt=""
          className="w-full max-w-sm hidden sm:block object-contain"
        />
      </div>

      <div className="register3 w-full md:w-1/2 flex flex-col items-center justify-center px-6 py-10">
        <div className="register4 text-center mb-6">
          <h3 className="text-xl md:text-2xl font-semibold text-gray-800">Join Expert Learning</h3>
          <p className="text-sm text-gray-600 mt-2">
            Already Have an Account? <span className="text-blue-600 underline cursor-pointer">Login</span>
          </p>
        </div>

        <div className="register6 text-center mb-4">
          <p className="text-sm text-gray-700">Enter the 4-digit OTP code sent to your phone</p>
        </div>

        <div className="landingpage4 w-full flex justify-center mb-4">
          <div className="otp-container flex gap-4">
            {otp.map((data, index) => (
              <input
                className="otp-input w-12 h-12 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="text"
                name="otp"
                maxLength="1"
                key={index}
                value={data}
                placeholder="0"
                onChange={(e) => handleChange(e.target, index)}
                onFocus={(e) => e.target.select()}
              />
            ))}
          </div>
        </div>

        <div className="landingpage5 w-full flex justify-center mb-4">
          <button
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded w-[70%] text-sm md:text-base transition duration-300"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </div>

        <div className="register9 text-sm text-gray-600 mb-4">
          <p>
            {isResendAllowed ? (
              <span className="text-blue-600 underline cursor-pointer" onClick={handleResend}>
                Resend OTP
              </span>
            ) : (
              `Resend OTP in 00:${timer.toString().padStart(2, '0')} Sec`
            )}
          </p>
        </div>

        <div className="register5 text-center text-xs text-gray-500">
          <p>
            By signing up, you agree to <span className="text-blue-600 underline">Terms & Conditions</span> and
            <br />
            <span className="text-blue-600 underline">Privacy Policy.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPVerify;