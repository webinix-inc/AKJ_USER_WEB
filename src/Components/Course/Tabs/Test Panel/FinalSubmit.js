import { Column, Pie } from "@ant-design/plots";
import {
  Button,
  Card,
  Col,
  Divider,
  Layout,
  Modal,
  Progress,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
  notification,
  Statistic,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import React, { useEffect, useRef, useState } from "react";
import { GiCancel } from "react-icons/gi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import akjLogo from "../../../../Image2/LOGO.jpeg";
import api from "../../../../api/axios";
import QuestionRenderer from "../../../../Components/MathRenderer";
import "./Exampage.css";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const Scorecard = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const scorecardId = id;

  const [scorecard, setScorecard] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingScorecard, setLoadingScorecard] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const scorecardRef = useRef(null);

  const location = useLocation();
  const { quizId, folderId } = location.state || {};

  // Prevent browser back button navigation
  useEffect(() => {
    const handleBackButton = (event) => {
      event.preventDefault();
      navigate("/explorecourses", { replace: true });
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [navigate]);

  useEffect(() => {
    const fetchScorecardDetails = async () => {
      if (!scorecardId) {
        setError("Scorecard ID is missing");
        setLoadingScorecard(false);
        return;
      }

      try {
        setLoadingScorecard(true);
        setError(null);

        // 🔧 FIX: Use the same pattern as ExamPage - let axios interceptor handle token
        // The interceptor in api/axios.js automatically adds Authorization header
        const response = await api.get(`/scorecards/${scorecardId}`);

        if (response.data && response.data.scorecard) {
          setScorecard(response.data.scorecard);
          setError(null);
        } else {
          setError("Scorecard data not found in response");
        }
      } catch (error) {
        console.error("Error fetching scorecard details:", error);

        // 🔧 FIX: Handle specific error cases
        if (error.response) {
          if (error.response.status === 401 || error.response.status === 403) {
            const errorMsg =
              error.response.data?.message || "Authentication failed";
            setError("Authentication failed. Please login again.");
            message.error(
              errorMsg.includes("token")
                ? "Session expired. Please login again."
                : errorMsg
            );

            // Clear invalid token and redirect after delay
            setTimeout(() => {
              localStorage.removeItem("token");
              localStorage.removeItem("userData");
              navigate("/login");
            }, 2000);
          } else if (error.response.status === 404) {
            setError("Scorecard not found");
            message.error("Scorecard not found");
          } else {
            setError(
              `Failed to load scorecard: ${
                error.response.data?.message || error.message
              }`
            );
            message.error(
              error.response.data?.message || "Failed to load scorecard details"
            );
          }
        } else if (error.request) {
          setError("Network error. Please check your connection.");
          message.error("Network error. Please check your connection.");
        } else {
          setError(`Error: ${error.message}`);
          message.error("Failed to load scorecard details");
        }
      } finally {
        setLoadingScorecard(false);
        setLoading(false);
      }
    };

    fetchScorecardDetails();
  }, [scorecardId, navigate]);

  useEffect(() => {
    const fetchQuizData = async () => {
      // 🔧 FIX: Get quizId from scorecard if not in location state
      const quizIdToUse = quizId || scorecard?.quizId?._id || scorecard?.quizId;
      if (!quizIdToUse) {
        console.warn("No quizId available to fetch questions");
        return;
      }

      try {
        setLoadingQuestions(true);
        const questionsResponse = await api.get(
          `/quizzes/${quizIdToUse}/questions`
        );
        setQuestions(questionsResponse?.data?.questions || []);
      } catch (error) {
        console.error("Error fetching quiz data:", error);
        notification.error({
          message: "Error Fetching Questions",
          description:
            error.response?.data?.message ||
            "Could not load the quiz questions. Please try again later.",
        });
      } finally {
        setLoadingQuestions(false);
      }
    };

    // 🔧 FIX: Fetch questions when scorecard is loaded (quizId might be in scorecard)
    if (scorecard && !loadingScorecard) {
      fetchQuizData();
    }
  }, [scorecard, quizId, loadingScorecard]);

  const downloadPDF = async () => {
    const element = scorecardRef.current;

    try {
      const canvas = await html2canvas(element, { useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      const imgWidth = 60;
      const imgHeight = 60;
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;

      pdf.addImage(akjLogo, "jpeg", x, y, imgWidth, imgHeight, "", "FAST");
      pdf.setTextColor(200, 200, 200);
      pdf.setFontSize(20);
      pdf.text("AKJ Classes", pdfWidth / 2, pdfHeight - 20, {
        align: "center",
      });

      pdf.save("scorecard.pdf");
      message.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("Failed to generate PDF");
    }
  };

  const showModal = (question) => {
    setCurrentQuestion(question);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setCurrentQuestion(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <Spin size="large" />
      </div>
    );
  }

  if (!scorecard) {
    return (
      <Text className="block text-center text-red-500 mt-5">
        Scorecard not found
      </Text>
    );
  }

  const {
    score,
    totalMarks,
    correctQuestions,
    incorrectQuestions,
    answers,
    createdAt,
    endTime,
  } = scorecard;

  // 🔧 FIX: Create answerMap for quick lookup - must be defined before questionColumns
  // Ensure answerMap is always defined, even if answers is empty
  const answerMap = new Map();
  if (answers && Array.isArray(answers)) {
    answers.forEach((answer) => {
      const questionId = answer.questionId?._id || answer.questionId;
      if (questionId) {
        answerMap.set(questionId.toString(), answer);
      }
    });
  }

  const totalQuestions = questions.length;
  const unattemptedQuestions =
    totalQuestions - (correctQuestions + incorrectQuestions);
  const performancePercentage = ((score / totalMarks) * 100).toFixed(2);

  const pieData = [
    { type: "Correct", value: correctQuestions },
    { type: "Incorrect", value: incorrectQuestions },
    { type: "Unattempted", value: unattemptedQuestions },
  ];

  const pieConfig = {
    appendPadding: 10,
    data: pieData,
    angleField: "value",
    colorField: "type",
    radius: 0.9,
    legend: { position: "bottom" },
    color: ["#52c41a", "#f5222d", "#faad14"],
    label: {
      type: "outer",
      content: "{name}: {percentage}",
      style: { fontSize: 12, textAlign: "center" },
    },
    interactions: [{ type: "element-active" }],
  };

  const columnConfig = {
    data: pieData,
    xField: "type",
    yField: "value",
    columnWidthRatio: 0.8,
    label: {
      position: "middle",
      style: { fill: "#ffffff", fontSize: 14, fontWeight: "bold" },
      formatter: (datum) => `${datum.value}`, // Always show the value, even if 0
    },
    meta: {
      type: { alias: "Category" },
      value: { alias: "Questions" },
    },
    // 🔧 FIX: Ensure 0 values are shown on the chart
    yAxis: {
      min: 0,
      tickCount: 6,
    },
  };

  // 🔧 FIX: Helper function to parse options from tables if options array is empty
  const parseOptionsFromTables = (tables) => {
    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      return [];
    }
    const options = [];
    tables.forEach((tableItem) => {
      try {
        if (typeof tableItem === "string" && tableItem.trim().startsWith("[")) {
          const parsed = JSON.parse(tableItem);
          if (
            Array.isArray(parsed) &&
            parsed.length >= 2 &&
            parsed[0] === "Option"
          ) {
            const optionText = parsed[1] || "";
            const isCorrect =
              parsed.length >= 3 && parsed[2]?.toLowerCase() === "correct";
            if (optionText.trim()) {
              options.push({
                optionText: optionText.trim(),
                isCorrect: isCorrect,
              });
            }
          }
        }
      } catch (error) {
        console.warn("Failed to parse table item:", tableItem, error);
      }
    });
    return options;
  };

  // 🔧 FIX: Define questionColumns as a function that uses answerMap from closure
  // This ensures answerMap is always accessible when the render functions are called
  const getQuestionColumns = () => [
    {
      title: "Question",
      key: "question",
      width: "40%",
      render: (_, record) => {
        // 🔧 FIX: Safety check for answerMap
        if (!answerMap) {
          console.warn("answerMap is not defined in render function");
          return <Text type="secondary">Loading...</Text>;
        }
        const answer = answerMap.get(
          record._id?.toString() || record.id?.toString()
        );
        const status = answer?.isCorrect
          ? "correct"
          : answer
          ? "incorrect"
          : "unattempted";

        return (
          <div>
            <div style={{ marginBottom: "8px" }}>
              <QuestionRenderer
                question={{
                  questionText: record.questionText,
                  tables: record.tables,
                  questionImage: record.questionImage,
                }}
              />
            </div>
            <div>
              {status === "correct" && (
                <Tag color="success" icon={<CheckCircleOutlined />}>
                  Correct
                </Tag>
              )}
              {status === "incorrect" && (
                <Tag color="error" icon={<CloseCircleOutlined />}>
                  Incorrect
                </Tag>
              )}
              {status === "unattempted" && (
                <Tag color="warning" icon={<QuestionCircleOutlined />}>
                  Unattempted
                </Tag>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Your Answer",
      key: "selectedOption",
      width: "25%",
      render: (_, record) => {
        const answer = answerMap.get(
          record._id?.toString() || record.id?.toString()
        );

        if (
          !answer ||
          !answer.selectedOptions ||
          answer.selectedOptions.length === 0
        ) {
          return <Tag color="orange">Unattempted</Tag>;
        }

        // Get options from record (either from options array or parse from tables)
        let availableOptions = record.options || [];
        if (availableOptions.length === 0 && record.tables) {
          availableOptions = parseOptionsFromTables(record.tables);
        }

        // Find selected option text
        const selectedOptionIds = answer.selectedOptions.map((opt) =>
          opt.toString()
        );
        const selectedOptions = availableOptions.filter((opt) => {
          const optId = opt._id?.toString() || opt.id?.toString();
          return selectedOptionIds.includes(optId);
        });

        if (selectedOptions.length === 0) {
          // Try to get option text from selectedOptions if it's an object with optionText
          const firstSelected = answer.selectedOptions[0];
          if (typeof firstSelected === "object" && firstSelected.optionText) {
            return <Text>{firstSelected.optionText}</Text>;
          }
          return <Tag color="orange">Option Selected (Details N/A)</Tag>;
        }

        return (
          <div>
            {selectedOptions.map((opt, idx) => (
              <Tag key={idx} color={answer.isCorrect ? "success" : "error"}>
                {opt.optionText || opt.label || `Option ${idx + 1}`}
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: "Correct Answer",
      key: "correctOption",
      width: "25%",
      render: (_, record) => {
        // Get options from record
        let availableOptions = record.options || [];
        if (availableOptions.length === 0 && record.tables) {
          availableOptions = parseOptionsFromTables(record.tables);
        }

        const correctOptions = availableOptions.filter((opt) => opt.isCorrect);

        if (correctOptions.length === 0) {
          return <Text type="secondary">N/A</Text>;
        }

        return (
          <div>
            {correctOptions.map((opt, idx) => (
              <Tag key={idx} color="success">
                {opt.optionText || opt.label || `Option ${idx + 1}`}
              </Tag>
            ))}
          </div>
        );
      },
    },
  ];

  // 🔧 FIX: Call the function to get the columns array
  const questionColumns = getQuestionColumns();

  console.log("Quesation data print:", questions);
  console.log("Score card print:", scorecard);

  return (
    <Layout className="min-h-screen bg-gray-50" ref={scorecardRef}>
      <Header
        style={{
          backgroundColor: "#fff",
          borderBottom: "1px solid #e8e8e8",
          padding: "0 24px",
          height: "64px",
          lineHeight: "64px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <Row justify="space-between" align="middle" style={{ height: "100%" }}>
          <Col>
            <Title
              level={4}
              style={{
                margin: 0,
                color: "#262626",
                fontWeight: 600,
                fontSize: "18px",
              }}
            >
              Scorecard - {scorecard?.quizId?.quizName || "Quiz"}
            </Title>
          </Col>
          <Col>
            <Space size="middle">
              <Button
                type="default"
                onClick={() => navigate("/mycourses")}
                style={{
                  height: "36px",
                  borderRadius: "6px",
                  fontWeight: 500,
                  borderColor: "#d9d9d9",
                  color: "#595959",
                }}
              >
                My Courses
              </Button>
            </Space>
          </Col>
        </Row>
      </Header>

      <Content className="p-5">
        {/* Statistics Cards - Full Width */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Total Questions"
                value={totalQuestions}
                valueStyle={{ color: "#1890ff" }}
                prefix={<QuestionCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Correct Answers"
                value={correctQuestions || 0}
                valueStyle={{ color: "#52c41a" }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Incorrect Answers"
                value={incorrectQuestions || 0}
                valueStyle={{ color: "#ff4d4f" }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Unattempted"
                value={unattemptedQuestions || 0}
                valueStyle={{ color: "#faad14" }}
                prefix={<QuestionCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Main Content: Left Panel (Questions + Score Overview) | Right Panel (Performance Breakdown) */}
        <Row gutter={[16, 16]}>
          {/* Left Panel: Question Cards + Score Overview */}
          <Col xs={24} lg={16}>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {/* Score Overview */}
              <Card title="Score Overview">
                <div className="text-center" style={{ marginBottom: 16 }}>
                  <Title level={2} style={{ margin: 0 }}>
                    {score}
                  </Title>
                  <Text type="secondary">Out of {totalMarks}</Text>
                </div>
                <Divider />
                <Progress
                  percent={parseFloat(performancePercentage)}
                  strokeColor={{
                    "0%": "#108ee9",
                    "100%": "#87d068",
                  }}
                />
                <div style={{ textAlign: "center", marginTop: 8 }}>
                  <Text strong>{performancePercentage}%</Text>
                </div>
              </Card>

              {/* Question-wise Breakdown */}
              <Card
                title="Question-wise Breakdown"
                extra={loadingQuestions && <Spin size="small" />}
              >
                {loadingQuestions ? (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16 }}>
                      <Text type="secondary">Loading questions...</Text>
                    </div>
                  </div>
                ) : questions.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <Text type="secondary">No questions available</Text>
                  </div>
                ) : (
                  <Table
                    dataSource={questions.map((q) => ({
                      ...q,
                      key: q._id || q.id,
                    }))}
                    columns={questionColumns}
                    pagination={{ pageSize: 5 }}
                    loading={loadingQuestions}
                    rowClassName={(record) => {
                      // 🔧 FIX: Safety check for answerMap
                      if (!answerMap) return "row-unattempted";
                      const answer = answerMap.get(
                        record._id?.toString() || record.id?.toString()
                      );
                      if (answer?.isCorrect) return "row-correct";
                      if (answer && !answer.isCorrect) return "row-incorrect";
                      return "row-unattempted";
                    }}
                  />
                )}
              </Card>
            </div>
          </Col>

          {/* Right Panel: Performance Breakdown (Pie Chart) */}
          <Col xs={24} lg={8}>
            <Card title="Performance Breakdown">
              <Pie {...pieConfig} />
              <Divider />
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={24} style={{ textAlign: "center", marginBottom: 8 }}>
                  <div>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        backgroundColor: "#52c41a",
                        borderRadius: "50%",
                        display: "inline-block",
                        marginRight: 8,
                      }}
                    ></div>
                    <Text strong>Correct: {correctQuestions || 0}</Text>
                  </div>
                </Col>
                <Col span={24} style={{ textAlign: "center", marginBottom: 8 }}>
                  <div>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        backgroundColor: "#f5222d",
                        borderRadius: "50%",
                        display: "inline-block",
                        marginRight: 8,
                      }}
                    ></div>
                    <Text strong>Incorrect: {incorrectQuestions || 0}</Text>
                  </div>
                </Col>
                <Col span={24} style={{ textAlign: "center" }}>
                  <div>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        backgroundColor: "#faad14",
                        borderRadius: "50%",
                        display: "inline-block",
                        marginRight: 8,
                      }}
                    ></div>
                    <Text strong>Unattempted: {unattemptedQuestions || 0}</Text>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Time vs Performance - Full Width */}
        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card title="Time vs Performance">
              <Column {...columnConfig} />
            </Card>
          </Col>
        </Row>

        {/* Modal for Question Details */}
        {currentQuestion && (
          <Modal visible={isModalOpen} onCancel={handleCancel} footer={null}>
            <Text strong>Question: </Text>
            <Text>{currentQuestion.questionText}</Text>
            <Divider />
            <Text strong>Options:</Text>
            <ul>
              {currentQuestion.options.map((opt, index) => (
                <li key={opt.id}>
                  <Text>
                    <span className="font-bold">Option-{index + 1}:</span>
                    {opt.optionText}{" "}
                    {opt.isCorrect && <Tag color="green">Correct</Tag>}
                  </Text>
                </li>
              ))}
            </ul>
          </Modal>
        )}
      </Content>
    </Layout>
  );
};

export default Scorecard;
