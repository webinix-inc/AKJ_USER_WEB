import {
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    LeftOutlined,
} from "@ant-design/icons";
import {
    Button,
    Card,
    Col,
    Layout,
    Modal,
    Radio,
    Row,
    Space,
    Spin,
    Typography,
    notification
} from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import HOC from "../../Components/HOC/HOC";
import QuestionRenderer from "../../Components/MathRenderer";
import { getOptimizedQuestionImage, handleQuestionImageError } from "../../utils/imageUtils";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const FreeTestExamPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0); // Timer in seconds
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [quizDetails, setQuizDetails] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [scorecardId, setScorecardId] = useState(null);
  const [testStarted, setTestStarted] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const quizId = id;

  // Fetch quiz details and start test
  useEffect(() => {
    const startTest = async () => {
      try {
        setLoading(true);
        
        // Fetch quiz details
        const quizResponse = await api.get(`/quizzes/${quizId}`);
        const quiz = quizResponse.data.quiz;
        
        if (!quiz || !quiz.isFreeTest) {
          notification.error({
            message: "Invalid Test",
            description: "This is not a free test or test not found.",
          });
          navigate("/free-test");
          return;
        }

        setQuizDetails(quiz);

        // Start the quiz to get scorecardId
        try {
          const startResponse = await api.post(`/quizzes/${quizId}/start`);
          if (startResponse.data && startResponse.data.scorecardId) {
            setScorecardId(startResponse.data.scorecardId);
            
            // Calculate time left from duration
            const durationInSeconds = (quiz.duration?.hours || 0) * 3600 + (quiz.duration?.minutes || 0) * 60;
            setTimeLeft(durationInSeconds);
            setTestStarted(true);
          }
        } catch (startError) {
          console.error("Error starting quiz:", startError);
          // For free tests, we'll still allow taking the test even if start fails
          const durationInSeconds = (quiz.duration?.hours || 0) * 3600 + (quiz.duration?.minutes || 0) * 60;
          setTimeLeft(durationInSeconds);
          setTestStarted(true);
        }

        // Fetch questions
        const questionsResponse = await api.get(`/quizzes/${quizId}/questions`);
        const formattedQuestions = questionsResponse.data.questions.map((q) => ({
          id: q._id,
          text: q.tables && q.tables.length > 0 ? q.tables : [q.questionText || "Question text not available"],
          questionText: q.questionText,
          tables: q.tables || [],
          parts: q.parts || [],
          hasImages: q.questionImage && q.questionImage.length > 0,
          questionImage: q.questionImage || [],
          options: q.options.map((option) => ({
            value: option._id,
            label: option.optionText,
            optionImage: option.optionImage || [],
          })),
        }));

        setQuestions(formattedQuestions);
        setTotalQuestions(formattedQuestions.length);
      } catch (error) {
        console.error("Error fetching quiz data:", error);
        notification.error({
          message: "Error Fetching Data",
          description: "Could not load the test. Please try again later.",
        });
        navigate("/free-test");
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      startTest();
    }
  }, [quizId, navigate]);

  // Timer countdown
  useEffect(() => {
    if (testStarted && timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [testStarted, timeLeft]);

  // Format time
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle answer selection
  const handleAnswerChange = (optionId) => {
    const questionId = questions[currentQuestion]?.id;
    if (!questionId) return;

    setSelectedOption(optionId);
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));

    // Submit answer if scorecardId exists
    if (scorecardId) {
      submitAnswer(questionId, optionId);
    }
  };

  // Submit answer to backend
  const submitAnswer = async (questionId, optionId) => {
    if (!scorecardId) return;

    try {
      await api.post(`/scorecards/${scorecardId}/submit/${questionId}`, {
        selectedOptions: [optionId],
      });
    } catch (error) {
      console.error("Error submitting answer:", error);
      // Don't show error to user, just log it
    }
  };

  // Navigation
  const navigateQuestion = (index) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentQuestion(index);
      const questionId = questions[index]?.id;
      setSelectedOption(answers[questionId] || null);
    }
  };

  // Auto submit when time runs out
  const handleAutoSubmit = async () => {
    if (scorecardId) {
      try {
        await api.post(`/scorecards/${scorecardId}/finish`);
        notification.info({
          message: "Time's Up!",
          description: "Your test has been auto-submitted.",
        });
      } catch (error) {
        console.error("Error auto-submitting:", error);
      }
    }
    navigate("/free-test");
  };

  // Manual submit
  const handleSubmit = async () => {
    Modal.confirm({
      title: "Submit Test",
      icon: <ExclamationCircleOutlined />,
      content: "Are you sure you want to submit the test? You cannot change your answers after submission.",
      okText: "Yes, Submit",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setLoading(true);
          if (scorecardId) {
            await api.post(`/scorecards/${scorecardId}/finish`);
          }
          notification.success({
            message: "Test Submitted",
            description: "Your test has been submitted successfully.",
          });
          navigate("/free-test");
        } catch (error) {
          console.error("Error submitting test:", error);
          notification.error({
            message: "Submission Error",
            description: "Failed to submit test. Please try again.",
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  if (loading && !testStarted) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!quizDetails || questions.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Text>No questions available for this test.</Text>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const isAnswered = currentQ && answers[currentQ.id];

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
      <Header
        style={{
          backgroundColor: "#001529",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 24px",
        }}
      >
        <Button
          icon={<LeftOutlined />}
          onClick={() => navigate("/free-test")}
          style={{ color: "#fff" }}
        >
          Back
        </Button>
        <Title level={4} style={{ color: "#fff", margin: 0 }}>
          {quizDetails.quizName}
        </Title>
        <Space>
          <ClockCircleOutlined style={{ color: "#fff", fontSize: "18px" }} />
          <Text strong style={{ color: timeLeft < 300 ? "#ff4d4f" : "#fff", fontSize: "16px" }}>
            {formatTime(timeLeft)}
          </Text>
        </Space>
      </Header>

      <Content style={{ padding: "24px" }}>
        <Row gutter={[16, 16]}>
          {/* Question Section */}
          <Col xs={24} lg={16}>
            <Card>
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <div>
                  <Text type="secondary">
                    Question {currentQuestion + 1} of {totalQuestions}
                  </Text>
                </div>

                <div>
                  {currentQ && (
                    <QuestionRenderer
                      question={{
                        ...currentQ,
                        tables: currentQ.tables || currentQ.text,
                        questionText: currentQ.questionText,
                      }}
                    />
                  )}
                  
                  {currentQ?.hasImages && currentQ.questionImage && (
                    <div style={{ marginTop: "16px" }}>
                      {currentQ.questionImage.map((img, idx) => (
                        <img
                          key={idx}
                          src={getOptimizedQuestionImage(img)}
                          alt={`Question ${currentQuestion + 1} - Image ${idx + 1}`}
                          onError={handleQuestionImageError}
                          style={{ maxWidth: "100%", marginBottom: "8px" }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Radio.Group
                    value={selectedOption}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    style={{ width: "100%" }}
                  >
                    <Space direction="vertical" style={{ width: "100%" }}>
                      {currentQ?.options.map((option) => (
                        <Radio key={option.value} value={option.value} style={{ display: "block" }}>
                          {option.label}
                          {option.optionImage && option.optionImage.length > 0 && (
                            <div style={{ marginTop: "8px" }}>
                              {option.optionImage.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={getOptimizedQuestionImage(img)}
                                  alt={`Option ${option.value} - Image ${idx + 1}`}
                                  onError={handleQuestionImageError}
                                  style={{ maxWidth: "200px", marginRight: "8px" }}
                                />
                              ))}
                            </div>
                          )}
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>
                </div>

                <Space>
                  <Button
                    disabled={currentQuestion === 0}
                    onClick={() => navigateQuestion(currentQuestion - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    type="primary"
                    disabled={currentQuestion === totalQuestions - 1}
                    onClick={() => navigateQuestion(currentQuestion + 1)}
                  >
                    Next
                  </Button>
                  {currentQuestion === totalQuestions - 1 && (
                    <Button type="primary" danger onClick={handleSubmit}>
                      Submit Test
                    </Button>
                  )}
                </Space>
              </Space>
            </Card>
          </Col>

          {/* Question Navigator */}
          <Col xs={24} lg={8}>
            <Card title="Question Navigator">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: "8px",
                }}
              >
                {questions.map((q, index) => {
                  const isAnswered = answers[q.id];
                  const isCurrent = index === currentQuestion;
                  return (
                    <Button
                      key={q.id}
                      type={isCurrent ? "primary" : isAnswered ? "default" : "dashed"}
                      onClick={() => navigateQuestion(index)}
                      style={{
                        minWidth: "40px",
                        height: "40px",
                      }}
                    >
                      {index + 1}
                    </Button>
                  );
                })}
              </div>
              <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#f0f0f0", borderRadius: "4px" }}>
                <Text strong>Answered: {Object.keys(answers).length} / {totalQuestions}</Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Content>

      <Footer style={{ textAlign: "center", backgroundColor: "#f0f2f5" }}>
        <Button type="primary" danger size="large" onClick={handleSubmit}>
          Submit Test
        </Button>
      </Footer>
    </Layout>
  );
};

export default HOC(FreeTestExamPage);
