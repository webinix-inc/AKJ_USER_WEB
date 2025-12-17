import React, { Suspense } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// Page imports
import Assignment from "./Pages/Assignment/Assignment";
import AttendanceOverview from "./Pages/Attendance Overview/AttendanceOverview";
import Contact from "./Pages/Contact/Contact";
import ExploreCourses from "./Pages/Explore Courses/ExploreCourses";
import FreeTest from "./Pages/FreeTest/FreeTest";
import FreeTestExamPage from "./Pages/FreeTest/FreeTestExamPage";
import Home from "./Pages/Home/Home";
import LandingPage from "./Pages/Landing Page/LandingPage";
import Login from "./Pages/Login/Login";
import NoticeOverview from "./Pages/Notice Overview/NoticeOverview";
import Notification from "./Pages/Notification/Notification";
import PricingPlans from "./Pages/Pricing Plans/PricingPlans";
import Profile from "./Pages/Profile/Profile";
import OTPVerify from "./Pages/Register/OTPVerify";
import Register from "./Pages/Register/Register";
import Results from "./Pages/Results/Results";
import Settings from "./Pages/Settings/Settings";
import BuyNow from "./Pages/Study Store/BuyNow";
import Checkout from "./Pages/Study Store/Checkout";
import Delivered from "./Pages/Study Store/Delivered";
import MyCart from "./Pages/Study Store/My_Cart";
import MyOrders from "./Pages/Study Store/My_Orders";
import OrderReview from "./Pages/Study Store/OrderReview";
import OrderSuccessful from "./Pages/Study Store/OrderSuccessful";
import StudyStore from "./Pages/Study Store/StudyStore";
import Privacy from "./Pages/TermandConditions/Privacy";
import Refund from "./Pages/TermandConditions/Refund";
import Terms from "./Pages/TermandConditions/Terms";

// Component imports
import BuyNowPage from "./Components/Course/BuyNowPage";
import BuyNowPage1 from "./Components/Course/BuyNowPage1";
import CourseDetails from "./Components/Course/CourseDetails";
import PurchasedCourses from "./Components/Course/PurchasedCourses";
import ExamPage from "./Components/Course/Tabs/Test Panel/ExamPage";
import FinalSubmit from "./Components/Course/Tabs/Test Panel/FinalSubmit";
import GiveTests from './Components/Course/Tabs/Test Panel/GiveTests';
import InstructionsDone from './Components/Course/Tabs/Test Panel/InstructionsDone';
import TestDetails from "./Components/Course/Tabs/Test Panel/TestDetails";
import AllFreeCourse from "./Components/FreeClass/AllFreeCourse";
import VideoPlayer from "./Components/VideoPlayer/VideoPlayer";

// Utility imports
import AppProviders from "./Context/AppProviders";
import AuthRoute from "./utils/AuthRoute";
import PrivateRoute from "./utils/PrivateRoute";

// Lazy loaded components for better performance
const Messages = React.lazy(() => import("././Components/Messeges/Messages"));

function App() {
  return (
    <AppProviders>
      {/* Global Toast Container */}
      <ToastContainer
        position="top-right" // You can adjust the position
        autoClose={5000} // Auto close after 5 seconds
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Router>
        <Routes>
                    <Route path="/" element={<LandingPage />} />
                    {/* Authenticated Routes */}
                    <Route
                      path="/home"
                      element={
                        <PrivateRoute>
                          <Home />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/explorecourses"
                      element={<ExploreCourses />}
                    />
                    <Route
                      path="/explorecourses/:id"
                      element={<CourseDetails />}
                    />

                    {/* Test Panel start from here */}

                    <Route
                      path="/exam-page/:id"
                      element={<ExamPage />}
                    />

                    <Route path="/test/:id" element={<TestDetails />} />

                    <Route path="/give-test/:id" element={<GiveTests />} />
                    <Route path="/instruction/:id" element={<InstructionsDone />} />
                    <Route path="/scorecard/:id" element={<FinalSubmit />} />

                    {/* Test Panel end here */}
                    <Route path="/free-test" element={<FreeTest />} />
                    <Route
                      path="/free-test/:id"
                      element={
                        <PrivateRoute>
                          <FreeTestExamPage />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/pricingplans"
                      element={
                        <PrivateRoute>
                          <PricingPlans />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/paymentpage"
                      element={
                        <PrivateRoute>
                          <BuyNowPage1 />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/studystore/categories"
                      element={<StudyStore />}
                    />
                    <Route path="/contact" element={<Contact />} />
                    <Route
                      path="/studystore/my_orders"
                      element={
                        <PrivateRoute>
                          <MyOrders />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/studystore/my_cart"
                      element={
                        <PrivateRoute>
                          <MyCart />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/studystore/delivered"
                      element={
                        <PrivateRoute>
                          <Delivered />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/studystore/books/:id"
                      element={
                        <PrivateRoute>
                          <BuyNow />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/checkout/:id"
                      element={
                        <PrivateRoute>
                          <BuyNowPage />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/checkout"
                      element={
                        <PrivateRoute>
                          <Checkout />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/mycourses"
                      element={
                        <PrivateRoute>
                          <PurchasedCourses />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/studystore/categories/buynow/overviewbill"
                      element={
                        <PrivateRoute>
                          <OrderReview />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/studystore/categories/buynow/overviewbill/ordersuccessful"
                      element={
                        <PrivateRoute>
                          <OrderSuccessful />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <PrivateRoute>
                          <Settings />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/Messages"
                      element={
                        <PrivateRoute>
                          <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div></div>}>
                            <Messages />
                          </Suspense>
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <PrivateRoute>
                          <Profile />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/noticeoverview"
                      element={
                        <PrivateRoute>
                          <NoticeOverview />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/assignment"
                      element={
                        <PrivateRoute>
                          <Assignment />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/results"
                      element={
                        <PrivateRoute>
                          <Results />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/attendanceoverview"
                      element={
                        <PrivateRoute>
                          <AttendanceOverview />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/notification"
                      element={
                        <PrivateRoute>
                          <Notification />
                        </PrivateRoute>
                      }
                    />
                    {/* Auth Routes (Public for unauthenticated users) */}
                    <Route
                      path="/register"
                      element={
                        <AuthRoute>
                          <Register />
                        </AuthRoute>
                      }
                    />
                    <Route
                      path="/otpverify"
                      element={
                        <AuthRoute>
                          <OTPVerify />
                        </AuthRoute>
                      }
                    />
                    <Route path="/allFreeCourses" element={<AllFreeCourse />} />

                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/refund" element={<Refund />} />

                    <Route
                      path="/login"
                      element={
                        <AuthRoute>
                          <Login />
                        </AuthRoute>
                      }
                    />
                    <Route path="/video/:videoId" element={<VideoPlayer />} />
        </Routes>
      </Router>
    </AppProviders>
  );
}

export default App;
