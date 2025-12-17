import React, { useState, useEffect } from "react";
import {
  Layout,
  Typography,
  Row,
  Col,
  Button,
  Radio,
  Card,
  Badge,
  Space,
  Alert,
  Modal,
  Popover,
} from "antd";
// 🔧 NEW: Import MathRenderer for LaTeX support
import QuestionRenderer from "../../../../Components/MathRenderer";
import {
  LeftOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { FaRegClock } from "react-icons/fa";
import {
  AiFillStar,
  AiOutlineCheckCircle,
  AiOutlineEye,
  AiOutlineQuestionCircle,
} from "react-icons/ai";
import "antd/dist/reset.css";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../../../api/axios";
import { notification } from "antd";
import { getOptimizedQuestionImage, handleQuestionImageError } from "../../../../utils/imageUtils";
import "./Exampage.css";

const { Header, Content, Footer } = Layout;

const ExamPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [reviewStatus, setReviewStatus] = useState({});
  const [answeredAndReviewed, setAnsweredAndReviewed] = useState({});
  const [timeLeft, setTimeLeft] = useState(2 * 60 * 60); // 2-hour timer
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenAttempts, setFullscreenAttempts] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [visited, setVisited] = useState({}); // Track visited questions
  const [quizDetails, setQuizDetails] = useState(null); // State for quiz details
  const [selectedOption, setSelectedOption] = useState(null);

  const navigate = useNavigate();
  const isScrollable = totalQuestions > 0;
  const { id } = useParams();
  const quizId = id;

  const location = useLocation();
  const { scorecardId, folderId } = location.state || {};

  useEffect(() => {
    // Define the function inside useEffect to prevent re-creation
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        const questionsResponse = await api.get(`/quizzes/${quizId}/questions`);

        // Map API questions to the frontend structure
        const formattedQuestions = questionsResponse.data.questions.map(
          (q) => ({
            id: q._id, // Use the correct ObjectId from backend (_id)
            // Use both questionText and tables for comprehensive content
            text: q.tables && q.tables.length > 0 ? q.tables : [q.questionText || "Question text not available"],
            questionText: q.questionText, // Keep original text for fallback
            hasImages: q.questionImage && q.questionImage.length > 0,
            questionImage: q.questionImage || [], // Include the actual image data
            options: q.options.map((option) => ({
              value: option._id, // Use the correct ObjectId for options
              label: option.optionText,
            })),
          })
        );

        setQuestions(formattedQuestions);
        setTotalQuestions(formattedQuestions.length);
        
        // 🔧 FIX: Initialize visited state for first question
        setVisited({ 0: true });
        
      } catch (error) {
        console.error("Error fetching quiz data:", error);
        notification.error({
          message: "Error Fetching Data",
          description:
            "Could not load the quiz questions. Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [quizId]);

  // 🔧 FIX: Load existing answer when question changes
  useEffect(() => {
    if (questions.length > 0 && questions[currentQuestion]) {
      const questionId = questions[currentQuestion].id;
      const existingAnswer = answers[questionId];
      setSelectedOption(existingAnswer || null);
      console.log(`📋 Loaded question ${currentQuestion + 1}, existing answer:`, existingAnswer);
    }
  }, [currentQuestion, questions, answers]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format time
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle answer selection
  // const handleAnswerChange = (questionId, selectedOption) => {
  //   // Validate the questionId
  //   if (!questionId || questionId.length !== 24) {
  //     console.error("Invalid questionId provided:", questionId);
  //     notification.error({
  //       message: "Invalid Question",
  //       description: "The question ID is not valid. Please try again.",
  //     });
  //     return; // Prevent submission for invalid question IDs
  //   }

  //   // Update the answers state
  //   setAnswers((prev) => ({
  //     ...prev,
  //     [questionId]: selectedOption,
  //   }));
  // };

  const handleAnswerChange = (questionId, option) => {
    console.log(`🔄 Answer changed for question ${questionId}:`, option);
    setSelectedOption(option);
    // Don't update answers state immediately - wait for successful submission
    // setAnswers((prev) => ({
    //   ...prev,
    //   [questionId]: option,
    // }));
  };

  // Toggle review status
  const toggleReview = (questionId) => {
    const isReviewed = reviewStatus[questionId];
    const isAnswered = !!answers[questionId];

    setReviewStatus({
      ...reviewStatus,
      [questionId]: !isReviewed,
    });

    if (isAnswered && !isReviewed) {
      setAnsweredAndReviewed({ ...answeredAndReviewed, [questionId]: true });
    } else if (isReviewed) {
      const { [questionId]: removed, ...rest } = answeredAndReviewed;
      setAnsweredAndReviewed(rest);
    }
  };

  // Navigation
  // const navigateQuestion = (index) => {
  //   setCurrentQuestion(index);

  //   // Mark the question as visited
  //   setVisited((prevVisited) => ({
  //     ...prevVisited,
  //     [index]: true,
  //   }));
  // };

  // const navigateQuestion = async (nextQuestionIndex) => {
  //   const currentQuestionId = questions[currentQuestion].id; // adjust if your question object structure is different
  //   const selectedOption = answers[currentQuestionId];

  //   // Validate before moving
  //   if (!selectedOption) {
  //     notification.warning({
  //       message: "No Option Selected",
  //       description:
  //         "Please select an option before moving to the next question.",
  //     });
  //     return;
  //   }

  //   try {
  //     // Submit answer
  //     await api.post(`/scorecards/${scorecardId}/submit/${currentQuestionId}`, {
  //       selectedOptions: [selectedOption],
  //     });

  //     // Optionally show success
  //     // notification.success({ message: "Answer saved successfully" });

  //     // Move to next question
  //     setCurrentQuestion(nextQuestionIndex);

  //     // Mark as visited
  //     setVisited((prevVisited) => ({
  //       ...prevVisited,
  //       [nextQuestionIndex]: true,
  //     }));
  //   } catch (error) {
  //     console.error("Error submitting answer:", error);
  //     notification.error({
  //       message: "Submission Failed",
  //       description: "Could not save your answer. Please try again.",
  //     });
  //   }
  // };

  const navigateQuestion = async (nextIndex) => {
    const currentQuestionId = questions[currentQuestion]?.id;

    // 🔧 FIX: Improved validation and error handling
    if (!currentQuestionId) {
      notification.error({ 
        message: "Invalid Question", 
        description: "Question ID is missing. Please refresh and try again." 
      });
      return;
    }

    if (!scorecardId) {
      notification.error({ 
        message: "Session Error", 
        description: "Quiz session is invalid. Please restart the quiz." 
      });
      return;
    }

    // 🔧 FIX: Allow navigation without answer for review purposes
    if (!selectedOption) {
      notification.warning({ 
        message: "No Answer Selected", 
        description: "You can review this question later." 
      });
      // Still allow navigation for review
      setCurrentQuestion(nextIndex);
      setVisited((prev) => ({ ...prev, [nextIndex]: true }));
      
      // Load existing answer for next question
      const nextQuestionId = questions[nextIndex]?.id;
      const existingAnswer = answers[nextQuestionId];
      setSelectedOption(existingAnswer || null);
      return;
    }

    try {
      const response = await api.post(`/scorecards/${scorecardId}/submit/${currentQuestionId}`, {
        selectedOptions: [selectedOption],
      });
      
      // Update state only after successful submission
      setAnswers(prev => ({
        ...prev,
        [currentQuestionId]: selectedOption
      }));
      
      // Move to next question
      setCurrentQuestion(nextIndex);
      setVisited((prev) => ({ ...prev, [nextIndex]: true }));
      
      // Load existing answer for next question
      const nextQuestionId = questions[nextIndex]?.id;
      const existingAnswer = answers[nextQuestionId];
      setSelectedOption(existingAnswer || null);
      
      notification.success({
        message: "Answer Saved",
        description: "Your answer has been saved successfully.",
        duration: 2,
      });
      
    } catch (error) {
      console.error("❌ Error submitting answer:", error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Could not save your answer. Please try again.";
      
      notification.error({
        message: "Submission Failed",
        description: errorMessage,
        duration: 4,
      });
      
      // Don't prevent navigation on error - allow user to continue
      console.log("⚠️ Allowing navigation despite submission error");
    }
  };

  // Calculate counts for Section Instructions
  const calculateCounts = () => {
    const answeredCount = Object.keys(answers).length || 0;
    const markedForReviewCount =
      Object.values(reviewStatus).filter(Boolean).length || 0;
    const answeredAndMarkedForReviewCount =
      Object.keys(answeredAndReviewed).length || 0;

    const notAnsweredCount = totalQuestions - answeredCount; // Questions not answered
    const notVisitedCount = totalQuestions - Object.keys(visited).length; // Questions never visited

    return {
      answeredCount,
      notAnsweredCount,
      markedForReviewCount,
      answeredAndMarkedForReviewCount,
      notVisitedCount,
    };
  };

  const {
    answeredCount,
    notAnsweredCount,
    markedForReviewCount,
    answeredAndMarkedForReviewCount,
    notVisitedCount,
  } = calculateCounts();

  const handleSubmitTest = () => {
    setShowSubmitModal(true);
  };

  // Request fullscreen
  const requestFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.error("Error requesting fullscreen:", err);
    }
  };

  // Exit fullscreen
  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Error exiting fullscreen:", err);
    }
  };

  // Add event listener for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenAttempts((prev) => prev + 1);
        setShowWarning(true);
        if (fullscreenAttempts >= 2) {
          handleConfirmSubmit(); // Auto-submit on third exit
        } else {
          requestFullscreen();
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [fullscreenAttempts]);

  // Automatically request fullscreen on page load
  useEffect(() => {
    requestFullscreen();
  }, []);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (
        event.key === "PrintScreen" ||
        (event.ctrlKey && event.shiftKey && event.key === "s")
      ) {
        event.preventDefault(); // Block screenshot event
        setFullscreenAttempts((prev) => prev + 1);

        if (fullscreenAttempts < 2) {
          notification.warning({
            message: "Screenshot Warning",
            description: `Attempt #${
              fullscreenAttempts + 1
            }. Do not take screenshots!`,
            placement: "topRight",
          });
        } else if (fullscreenAttempts === 2) {
          notification.error({
            message: "Final Warning!",
            description: "One more screenshot will auto-submit your test.",
            placement: "topRight",
          });
        } else if (fullscreenAttempts >= 3) {
          notification.error({
            message: "Test Auto-Submitted",
            description:
              "You have taken too many screenshots. The test has been submitted.",
            placement: "topRight",
          });

          setTimeout(() => handleConfirmSubmit(), 3000); // Auto-submit after 3 seconds
        }
      }
    };

    // Prevent Developer Tools (F12, Ctrl+Shift+I/J)
    const preventDevTools = (event) => {
      if (
        event.key === "F12" ||
        (event.ctrlKey &&
          event.shiftKey &&
          (event.key === "I" || event.key === "J"))
      ) {
        event.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    document.addEventListener("keydown", preventDevTools);
    document.addEventListener("contextmenu", (e) => e.preventDefault()); // Disable right-click

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      document.removeEventListener("keydown", preventDevTools);
      document.removeEventListener("contextmenu", (e) => e.preventDefault());
    };
  }, [fullscreenAttempts]);

  const handleBackToTest = async () => {
    try {
      await requestFullscreen();
      setShowWarning(false);
    } catch (err) {
      console.error("Error returning to test:", err);
    }
  };

  const handleConfirmSubmit = async () => {
    try {
      const response = await api.post(`/scorecards/${scorecardId}/finish`);
      console.log("Quiz submitted successfully:", response.data);

      notification.success({
        message: "Quiz Submitted",
        description: "Your test has been successfully submitted.",
        placement: "topRight",
      });

      // Navigate to the final submit page with the quizId and scorecardId passed in the location state
      navigate(`/scorecard/${scorecardId}`, {
        state: {
          quizId, // Pass the current quizId
          scorecardId, // Pass the scorecardId as well
          folderId, // Pass the folderId
        },
      });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      notification.error({
        message: "Submission Failed",
        description: "Could not complete the quiz. Please try again.",
        placement: "topRight",
      });
    } finally {
      setShowSubmitModal(false); // Close the submit modal in any case
    }
  };

  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        console.log("Fetching quiz details...");
        const response = await api.get(`/admin/quizzes/${quizId}`);
        console.log("Quiz Details Response:", response.data);

        // Set quiz details into state
        const { quiz } = response.data;
        setQuizDetails(quiz);
      } catch (error) {
        console.error("Error fetching quiz details:", error);
      }
    };

    fetchQuizDetails();
  }, []);

  const content = (
    <div>
      <p>
        <b>Marking Scheme:</b>
      </p>
      <p>+2 If the correct option(s) is selected;</p>
      <p>No marks will be awarded if no attempt is made;</p>
      <p>No negative marks will be awarded if incorrectly attempted.</p>
    </div>
  );

  return (
    <Layout className="exam-page" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <Header
        style={{
          backgroundColor: "#fff",
          borderBottom: "1px solid #ddd",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Space>
          <Button
            type="link"
            icon={<LeftOutlined />}
            style={{ fontSize: "16px" }}
          >
            {quizDetails?.createdAt}
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {quizDetails?.quizName}
          </Typography.Title>
        </Space>
        <Button onClick={isFullscreen ? exitFullscreen : requestFullscreen}>
          {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        </Button>
      </Header>

      {/* Warning Message */}
      {showWarning && (
        <Modal
          open={showWarning}
          footer={null}
          closable={false}
          centered
          bodyStyle={{
            textAlign: "center",
            padding: "24px",
          }}
        >
          <Alert
            message={`Warning: Fullscreen is required. Attempt #${fullscreenAttempts}`}
            type="error"
            showIcon
            style={{ marginBottom: "16px" }}
          />
          <div
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              marginBottom: "24px",
            }}
          >
            Your test will be submitted if you try to sneak away from the test
            screen.
          </div>
          <Button type="primary" onClick={handleBackToTest}>
            Back to test
          </Button>
        </Modal>
      )}

      {/* Content */}
      <Content style={{ padding: "16px" }}>
        <Row gutter={16}>
          {/* Main Question Panel */}

          <Col span={16} style={{ margin: "0 auto" }}>
            <Card>
              <div
                style={{
                  borderBottom: "1px solid #d9d9d9",
                  background: "#fff",
                  padding: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {/* Question Number (Left Aligned) */}
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Question-{currentQuestion + 1}
                </span>

                {/* Right Section */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  {/* Timer */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "#e6ffed",
                      color: "#52c41a",
                      fontSize: "12px",
                      height: "24px",
                      lineHeight: "24px",
                      borderRadius: "16px",
                      border: "1px solid #b7eb8f",
                      padding: "0 8px",
                      gap: "4px",
                    }}
                  >
                    <FaRegClock
                      style={{
                        color: "#52c41a",
                        fontSize: "14px",
                      }}
                    />
                    {formatTime(timeLeft)}
                  </div>

                  <div style={{ padding: "20px" }}>
                    <Popover
                      content={content} // The content inside the popover
                      placement="bottom" // Show below the text
                      trigger="hover" // Activate on hover
                    >
                      <span // Ensure the entire word is the hoverable area
                        style={{
                          fontSize: "14px",
                          color: "#000",
                          cursor: "pointer",
                          display: "inline-block", // Makes the span behave like a block-level element for easier hovering
                        }}
                      >
                        Marking Scheme: +2
                      </span>
                    </Popover>
                  </div>

                  {/* Button */}
                  <button
                    style={{
                      fontSize: "12px",
                      padding: "0 12px",
                      height: "30px",
                      borderRadius: "4px",
                      backgroundColor: reviewStatus[currentQuestion]
                        ? "#1890ff"
                        : "#fff",
                      color: reviewStatus[currentQuestion] ? "#fff" : "#000",
                      border: reviewStatus[currentQuestion]
                        ? "1px solid #1890ff"
                        : "1px solid #d9d9d9",
                      cursor: "pointer",
                      display: "flex", // Ensure the layout works in both cases
                      alignItems: "center", // Align content vertically
                      gap: "8px", // Space between icon and text
                    }}
                    onClick={() => toggleReview(currentQuestion)}
                  >
                    <AiOutlineEye
                      style={{
                        fontSize: "18px",
                        color: reviewStatus[currentQuestion]
                          ? "#fff"
                          : "#1890ff", // Dynamically adjust icon color
                      }}
                    />
                    <span>
                      {reviewStatus[currentQuestion]
                        ? "Unmark"
                        : "Mark for Review"}
                    </span>
                  </button>
                </div>
              </div>

              <div
                style={{
                  padding: "12px 16px",
                  marginTop: "20px",
                  border: "1px solid #d9d9d9",
                  borderRadius: "6px",
                  background: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <>
                  {questions[currentQuestion] ? (
                    <>
                      {/* 🔧 NEW: Use QuestionRenderer for LaTeX support */}
                      <Typography.Text>
                        <QuestionRenderer 
                          question={{
                            ...questions[currentQuestion],
                            // Map legacy structure for compatibility
                            tables: questions[currentQuestion].text,
                            questionText: questions[currentQuestion].questionText,
                            questionImage: questions[currentQuestion].questionImage
                          }}
                        />
                      </Typography.Text>

                      {/* 🔧 NEW: Display question images if available */}
                      {questions[currentQuestion]?.hasImages && questions[currentQuestion]?.questionImage?.length > 0 && (
                        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
                          {questions[currentQuestion].questionImage.map((imageUrl, index) => {
                            const optimizedUrl = getOptimizedQuestionImage(imageUrl);
                            
                            if (!optimizedUrl) {
                              return null;
                            }
                            
                            return (
                              <img
                                key={index}
                                src={optimizedUrl}
                                alt={`Question ${currentQuestion + 1} - Image ${index + 1}`}
                                style={{
                                  maxWidth: "100%",
                                  height: "auto",
                                  borderRadius: "8px",
                                  marginBottom: index < questions[currentQuestion].questionImage.length - 1 ? "8px" : "0",
                                  border: "1px solid #d9d9d9",
                                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                                }}
                                crossOrigin="anonymous"
                                onError={(e) => handleQuestionImageError(e, imageUrl)}
                                onLoad={() => console.log('Quiz question image loaded successfully:', optimizedUrl)}
                              />
                            );
                          })}
                        </div>
                      )}

                      <Radio.Group
                        onChange={(e) =>
                          handleAnswerChange(
                            questions[currentQuestion]?.id,
                            e.target.value
                          )
                        } // Use valid questionId
                        value={selectedOption} // 🔧 FIX: Use selectedOption for immediate visual feedback
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          marginTop: "16px",
                        }}
                      >
                        {questions[currentQuestion]?.options.map(
                          (option, idx) => (
                            <Radio 
                              key={idx} 
                              value={option.value}
                              style={{
                                padding: "8px 12px",
                                border: selectedOption === option.value ? "2px solid #1890ff" : "1px solid #d9d9d9",
                                borderRadius: "6px",
                                backgroundColor: selectedOption === option.value ? "#f0f8ff" : "transparent",
                                transition: "all 0.3s ease"
                              }}
                            >
                              <span style={{ 
                                fontWeight: selectedOption === option.value ? "600" : "normal",
                                color: selectedOption === option.value ? "#1890ff" : "inherit"
                              }}>
                                {selectedOption === option.value && "✓ "}{option.label}
                              </span>
                            </Radio>
                          )
                        )}
                      </Radio.Group>
                    </>
                  ) : (
                    <Typography.Text type="secondary">
                      Loading question...
                    </Typography.Text>
                  )}
                </>
              </div>
            </Card>

            <div
              style={{
                marginTop: "16px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Button
                disabled={currentQuestion === 0}
                onClick={() => navigateQuestion(currentQuestion - 1)}
                icon={<LeftOutlined />}
              >
                Previous
              </Button>
              <Button
                disabled={!scorecardId || currentQuestion >= questions.length - 1}
                type="primary"
                onClick={() => navigateQuestion(currentQuestion + 1)}
                loading={loading}
              >
                {selectedOption ? "Save & Next" : "Skip & Next"}
              </Button>
              {/* <Button
                disabled={currentQuestion === questions.length}
                type="primary"
                onClick={() => navigateQuestion(currentQuestion + 1)}
              >
                Save & Next
              </Button> */}
            </div>
          </Col>

          {/* Sidebar */}
          <Col span={8}>
            {/* Section Instructions */}
            <Card>
              <Typography.Title level={5}>
                Section Instructions:
              </Typography.Title>

              <Row gutter={[14, 14]}>
                {/* Row 1: Not Answered and Answered */}
                <Col span={12} style={{ textAlign: "center" }}>
                  <Badge
                    count={notAnsweredCount}
                    style={{
                      background:
                        "linear-gradient(to bottom, #ff4d4f, #ff7875)",
                      color: "#fff",
                      fontSize: "20px",
                      height: "50px",
                      width: "50px",
                      lineHeight: "50px",
                      borderRadius: "0 0 50% 50%", // Pentagon-like
                      boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                      border: "none",
                    }}
                  />
                  <Typography.Text
                    style={{
                      display: "block",
                      marginTop: "8px",
                      fontSize: "14px",
                      color: "#333",
                    }}
                  >
                    Not Answered
                  </Typography.Text>
                </Col>
                <Col span={12} style={{ textAlign: "center" }}>
                  <Badge
                    count={answeredCount}
                    style={{
                      background:
                        "linear-gradient(to bottom, #52b062, #52b062)",
                      color: "#fff",
                      fontSize: "20px",
                      height: "50px",
                      width: "50px",
                      lineHeight: "50px",
                      borderRadius: "0 0 50% 50%",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                      border: "none",
                    }}
                  />
                  <Typography.Text
                    style={{ display: "block", marginTop: "8px" }}
                  >
                    Answered
                  </Typography.Text>
                </Col>

                {/* Row 2: Marked for Review and Answered and Marked for Review */}
                <Col span={12} style={{ textAlign: "center" }}>
                  <Badge
                    count={markedForReviewCount}
                    style={{
                      background:
                        "linear-gradient(to bottom, #745195, #745195)",
                      color: "#fff",
                      fontSize: "20px",
                      height: "50px",
                      width: "50px",
                      lineHeight: "50px",
                      borderRadius: "50%",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                      border: "none",
                    }}
                  />
                  <Typography.Text
                    style={{ display: "block", marginTop: "8px" }}
                  >
                    Marked for Review
                  </Typography.Text>
                </Col>
                <Col span={12} style={{ textAlign: "center" }}>
                  <Badge
                    count={answeredAndMarkedForReviewCount}
                    style={{
                      background: "white",
                      color: "#000000",
                      fontSize: "20px",
                      height: "50px",
                      width: "50px",
                      lineHeight: "50px",

                      boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                      border: "none",
                    }}
                  />
                  <Typography.Text
                    style={{ display: "block", marginTop: "8px" }}
                  >
                    Answered and Marked for Review
                  </Typography.Text>
                </Col>

                {/* Row 3: Not Visited */}
                <Col span={24} style={{ textAlign: "center" }}>
                  <Badge
                    count={notVisitedCount}
                    style={{
                      background:
                        "linear-gradient(to bottom, #ffffff, #ffffff)",
                      color: "#000000",
                      fontSize: "20px",
                      height: "50px",
                      width: "50px",
                      lineHeight: "50px",
                      borderRadius: "50%",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                      border: "none",
                    }}
                  />
                  <Typography.Text
                    style={{ display: "block", marginTop: "8px" }}
                  >
                    Not Visited
                  </Typography.Text>
                </Col>
              </Row>
            </Card>

            {/* Questions Grid */}
            <Card
              style={{
                marginTop: "16px",
                textAlign: "center",
              }}
              title={
                <Typography.Title level={5} style={{ margin: 0 }}>
                  MCQ Questions
                </Typography.Title>
              }
            >
              <div
                style={{
                  display: "flex",
                  maxHeight: "300px",
                  overflowY: "scroll",
                  overflowX: "hidden",
                  paddingRight: "8px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "8px",
                    width: "100%",
                  }}
                >
                  {questions.map((question, index) => {
                    const isAnswered = !!answers[question.id]; // ✅ Check if answered
                    const isMarkedForReview = !!reviewStatus[index]; // 🟣 Check if marked (use index, not question.id)
                    const isVisited = !!visited[index]; // 🟠 Check if visited
                    const isCurrent = index === currentQuestion; // 🔵 Current question
                    const isAnsweredAndMarked = isAnswered && isMarkedForReview; // 🔵 Both

                    let buttonColor = "#f0f0f0"; // Default ⚪ (Not Visited)
                    let textColor = "#666";

                    if (isCurrent) {
                      buttonColor = "#1890ff"; // 🔵 Blue (Current Question)
                      textColor = "#fff";
                    } else if (isAnsweredAndMarked) {
                      buttonColor = "#722ed1"; // 🟣 Purple (Answered & Marked)
                      textColor = "#fff";
                    } else if (isAnswered) {
                      buttonColor = "#52c41a"; // ✅ Green (Answered)
                      textColor = "#fff";
                    } else if (isMarkedForReview) {
                      buttonColor = "#fa8c16"; // 🟠 Orange (Marked for Review)
                      textColor = "#fff";
                    } else if (isVisited) {
                      buttonColor = "#ff4d4f"; // 🔴 Red (Visited but Not Answered)
                      textColor = "#fff";
                    }

                    return (
                      <Button
                        key={index}
                        style={{
                          backgroundColor: buttonColor,
                          color: textColor,
                          height: "40px",
                          width: "40px",
                          fontWeight: "bold",
                          border: isCurrent ? "2px solid #096dd9" : "1px solid #d9d9d9",
                          borderRadius: "4px",
                          transition: "all 0.2s ease",
                        }}
                        onClick={() => {
                          console.log(`🔄 Navigating to question ${index + 1} via grid`);
                          setCurrentQuestion(index);
                          setVisited(prev => ({ ...prev, [index]: true }));
                          
                          // Load existing answer for the selected question
                          const questionId = questions[index]?.id;
                          const existingAnswer = answers[questionId];
                          setSelectedOption(existingAnswer || null);
                          console.log(`🔄 Grid navigation - loaded existing answer for question ${questionId}:`, existingAnswer);
                        }}
                        onMouseEnter={(e) => {
                          if (!isCurrent) {
                            e.target.style.opacity = "0.8";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.opacity = "1";
                        }}
                      >
                        {index + 1}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </Card>

            <Button
              type="primary"
              size="large"
              style={{ marginTop: "16px", width: "100%" }}
              onClick={handleSubmitTest}
            >
              Submit Test
            </Button>
          </Col>
        </Row>
      </Content>

      {/* Footer */}
      <Footer style={{ textAlign: "center" }}>
        <Typography.Text>©2025 Mock Test Application</Typography.Text>
      </Footer>

      {/* Submit Test Modal */}
      <Modal
        open={showSubmitModal}
        onCancel={() => setShowSubmitModal(false)}
        footer={[
          <Button
            key="submit"
            type="primary"
            onClick={handleConfirmSubmit}
            style={{
              backgroundColor: "#1890ff",
              borderColor: "#1890ff",
              color: "#fff",
            }}
          >
            Submit Test
          </Button>,
        ]}
        centered
      >
        <Typography.Title level={5}>Submit Test</Typography.Title>
        <Typography.Text style={{ display: "block", marginBottom: "16px" }}>
          Are you sure you want to end this test?
        </Typography.Text>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaRegClock style={{ fontSize: "20px", color: "#fa8c16" }} />
              <Typography.Text>Time Remaining</Typography.Text>
            </div>
            <Typography.Text>{formatTime(timeLeft)}</Typography.Text>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AiOutlineQuestionCircle
                style={{ fontSize: "20px", color: "#1890ff" }}
              />
              <Typography.Text>Total Questions</Typography.Text>
            </div>
            <Typography.Text>{totalQuestions}</Typography.Text>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AiOutlineCheckCircle
                style={{ fontSize: "20px", color: "#52c41a" }}
              />
              <Typography.Text>Questions Answered</Typography.Text>
            </div>
            <Typography.Text>{answeredCount}</Typography.Text>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AiFillStar style={{ fontSize: "20px", color: "#722ed1" }} />
              <Typography.Text>Marked for Review</Typography.Text>
            </div>
            <Typography.Text>{markedForReviewCount}</Typography.Text>
          </div>
        </div>
      </Modal>
      <div className="exam-overlay"></div>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0,0,0,0.1)",
          zIndex: 99999,
          pointerEvents: "none",
        }}
      ></div>
    </Layout>
  );
};

export default ExamPage;
