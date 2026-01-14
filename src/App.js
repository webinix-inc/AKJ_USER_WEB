import React, { Suspense, lazy, useEffect } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// Utility imports (keep these synchronous - needed immediately)
import AppProviders from "./Context/AppProviders";
import AuthRoute from "./utils/AuthRoute";
import PrivateRoute from "./utils/PrivateRoute";
import { useSocket } from "./Context/SocketContext"; // Import useSocket
import { toast } from "react-toastify"; // Ensure toast is imported

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Lazy load ALL routes for optimal code splitting and performance
// Only LandingPage is kept synchronous as it's the entry point
const LandingPage = lazy(() => import("./Pages/Landing Page/LandingPage"));

// Page imports - Lazy loaded
const Assignment = lazy(() => import("./Pages/Assignment/Assignment"));
const AttendanceOverview = lazy(() =>
  import("./Pages/Attendance Overview/AttendanceOverview")
);
const Contact = lazy(() => import("./Pages/Contact/Contact"));
const ExploreCourses = lazy(() =>
  import("./Pages/Explore Courses/ExploreCourses")
);
const FreeTest = lazy(() => import("./Pages/FreeTest/FreeTest"));
const FreeTestExamPage = lazy(() =>
  import("./Pages/FreeTest/FreeTestExamPage")
);
const Home = lazy(() => import("./Pages/Home/Home"));
const Login = lazy(() => import("./Pages/Login/Login"));
const NoticeOverview = lazy(() =>
  import("./Pages/Notice Overview/NoticeOverview")
);
const Notification = lazy(() => import("./Pages/Notification/Notification"));
const PricingPlans = lazy(() => import("./Pages/Pricing Plans/PricingPlans"));
const Profile = lazy(() => import("./Pages/Profile/Profile"));
const OTPVerify = lazy(() => import("./Pages/Register/OTPVerify"));
const Register = lazy(() => import("./Pages/Register/Register"));
const Results = lazy(() => import("./Pages/Results/Results"));
const Settings = lazy(() => import("./Pages/Settings/Settings"));
const BuyNow = lazy(() => import("./Pages/Study Store/BuyNow"));
const Checkout = lazy(() => import("./Pages/Study Store/Checkout"));
const Delivered = lazy(() => import("./Pages/Study Store/Delivered"));
const MyCart = lazy(() => import("./Pages/Study Store/My_Cart"));
const MyOrders = lazy(() => import("./Pages/Study Store/My_Orders"));
const OrderReview = lazy(() => import("./Pages/Study Store/OrderReview"));
const OrderSuccessful = lazy(() =>
  import("./Pages/Study Store/OrderSuccessful")
);
const StudyStore = lazy(() => import("./Pages/Study Store/StudyStore"));
const Privacy = lazy(() => import("./Pages/TermandConditions/Privacy"));
const Refund = lazy(() => import("./Pages/TermandConditions/Refund"));
const Terms = lazy(() => import("./Pages/TermandConditions/Terms"));

// Component imports - Lazy loaded
const BuyNowPage = lazy(() => import("./Components/Course/BuyNowPage"));
const BuyNowPage1 = lazy(() => import("./Components/Course/BuyNowPage1"));
const CourseDetails = lazy(() => import("./Components/Course/CourseDetails"));
const PurchasedCourses = lazy(() =>
  import("./Components/Course/PurchasedCourses")
);
const ExamPage = lazy(() =>
  import("./Components/Course/Tabs/Test Panel/ExamPage")
);
const FinalSubmit = lazy(() =>
  import("./Components/Course/Tabs/Test Panel/FinalSubmit")
);
const GiveTests = lazy(() =>
  import("./Components/Course/Tabs/Test Panel/GiveTests")
);
const InstructionsDone = lazy(() =>
  import("./Components/Course/Tabs/Test Panel/InstructionsDone")
);
const TestDetails = lazy(() =>
  import("./Components/Course/Tabs/Test Panel/TestDetails")
);
const AllFreeCourse = lazy(() =>
  import("./Components/FreeClass/AllFreeCourse")
);
const VideoPlayer = lazy(() => import("./Components/VideoPlayer/VideoPlayer"));
const Messages = lazy(() => import("./Components/Messeges/Messages"));

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
      <SocketWrapper />
    </AppProviders>
  );
}

// Wrapper component to use hooks inside AppProviders
const SocketWrapper = () => {
  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      const handleNotification = (data) => {
        toast.info(
          <div>
            <h4 className="font-bold">{data.title}</h4>
            <p className="text-sm">{data.message}</p>
          </div>
        );
      };

      socket.on("notification", handleNotification);

      return () => {
        socket.off("notification", handleNotification);
      };
    }
  }, [socket]);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <LandingPage />
            </Suspense>
          }
        />
        {/* Authenticated Routes */}
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <Home />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/explorecourses"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ExploreCourses />
            </Suspense>
          }
        />
        <Route
          path="/explorecourses/:id"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <CourseDetails />
            </Suspense>
          }
        />

        {/* Test Panel start from here */}

        <Route
          path="/exam-page/:id"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ExamPage />
            </Suspense>
          }
        />

        <Route
          path="/test/:id"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <TestDetails />
            </Suspense>
          }
        />

        <Route
          path="/give-test/:id"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <GiveTests />
            </Suspense>
          }
        />
        <Route
          path="/instruction/:id"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <InstructionsDone />
            </Suspense>
          }
        />
        <Route
          path="/scorecard/:id"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <FinalSubmit />
            </Suspense>
          }
        />

        {/* Test Panel end here */}
        <Route
          path="/free-test"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <FreeTest />
            </Suspense>
          }
        />
        <Route
          path="/free-test/:id"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <FreeTestExamPage />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/pricingplans"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <PricingPlans />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/paymentpage"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <BuyNowPage1 />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/studystore/categories"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <StudyStore />
            </Suspense>
          }
        />
        <Route
          path="/contact"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Contact />
            </Suspense>
          }
        />
        <Route
          path="/studystore/my_orders"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <MyOrders />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/studystore/my_cart"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <MyCart />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <MyCart />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <MyOrders />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/studystore/delivered"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <Delivered />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/studystore/books/:id"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <BuyNow />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/checkout/:id"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <BuyNowPage />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <Checkout />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/mycourses"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <PurchasedCourses />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/studystore/categories/buynow/overviewbill"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <OrderReview />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/studystore/categories/buynow/overviewbill/ordersuccessful"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <OrderSuccessful />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <Settings />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/Messages"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <Messages />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <Profile />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/noticeoverview"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <NoticeOverview />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/assignment"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <Assignment />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/results"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <Results />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/attendanceoverview"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AttendanceOverview />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path="/notification"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingFallback />}>
                <Notification />
              </Suspense>
            </PrivateRoute>
          }
        />
        {/* Auth Routes (Public for unauthenticated users) */}
        <Route
          path="/register"
          element={
            <AuthRoute>
              <Suspense fallback={<LoadingFallback />}>
                <Register />
              </Suspense>
            </AuthRoute>
          }
        />
        <Route
          path="/otpverify"
          element={
            <AuthRoute>
              <Suspense fallback={<LoadingFallback />}>
                <OTPVerify />
              </Suspense>
            </AuthRoute>
          }
        />
        <Route
          path="/allFreeCourses"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <AllFreeCourse />
            </Suspense>
          }
        />

        <Route
          path="/terms"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Terms />
            </Suspense>
          }
        />
        <Route
          path="/privacy"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Privacy />
            </Suspense>
          }
        />
        <Route
          path="/refund"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Refund />
            </Suspense>
          }
        />

        <Route
          path="/login"
          element={
            <AuthRoute>
              <Suspense fallback={<LoadingFallback />}>
                <Login />
              </Suspense>
            </AuthRoute>
          }
        />
        <Route
          path="/video/:videoId"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <VideoPlayer />
            </Suspense>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
