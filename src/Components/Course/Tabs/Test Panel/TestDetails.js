import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  List,
  Button,
  Typography,
  Spin,
  message,
  Collapse,
  notification,
  Modal,
  Card,
  Row,
  Col,
  Tag,
  Statistic,
  Table,
  Result,
} from "antd";
import {
  FileOutlined,
  FolderOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
  PlayCircleOutlined,
  TrophyOutlined,
  BookOutlined,
  RocketOutlined,
  StarOutlined,
  FireOutlined,
} from "@ant-design/icons";
import HOC from "../../../HOC/HOC";
import api from "../../../../api/axios";
import moment from "moment";
import LoadingSpinner from "../../../Common/LoadingSpinner";
import ErrorBoundary from "../../../Common/ErrorBoundary";

// Custom styles for enhanced UI
const customStyles = `
  .quiz-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .quiz-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
  }
  
  .custom-collapse .ant-collapse-item {
    border: none !important;
    background: transparent !important;
  }
  
  .custom-collapse .ant-collapse-header {
    border-radius: 12px !important;
    background: rgba(255, 255, 255, 0.1) !important;
    border: none !important;
    padding: 16px !important;
  }
  
  .custom-collapse .ant-collapse-content {
    background: transparent !important;
    border: none !important;
  }
  
  .custom-table .ant-table-thead > tr > th {
    background: #f8fafc !important;
    border-bottom: 2px solid #e2e8f0 !important;
    font-weight: 600 !important;
    color: #374151 !important;
  }
  
  .custom-collapse-white .ant-collapse-item {
    border: none !important;
    background: transparent !important;
  }
  
  .custom-collapse-white .ant-collapse-header {
    border-radius: 12px !important;
    background: #f9fafb !important;
    border: 1px solid #e5e7eb !important;
    padding: 16px !important;
  }
  
  .custom-collapse-white .ant-collapse-content {
    background: transparent !important;
    border: none !important;
  }
  
  .attempt-details-modal .ant-modal-header {
    background: #f8fafc !important;
    border-bottom: 1px solid #e5e7eb !important;
    border-radius: 8px 8px 0 0 !important;
  }
  
  .attempt-details-modal .ant-modal-title {
    color: #374151 !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = customStyles;
  document.head.appendChild(styleSheet);
}

const { Text, Title } = Typography;
const { Panel } = Collapse;

const TestDetails = () => {
  const location = useLocation();
  const folderId = location.state?.folderId;
  const firstTestId = location.state?.firstTestId;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [folderContents, setFolderContents] = useState({});
  const [error, setError] = useState(null);
  const [quizHistories, setQuizHistories] = useState({});
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchFolderContents = async () => {
      // Validate folderId before making API call
      if (!folderId || folderId === 'undefined' || folderId === 'null') {
        console.error("Invalid folderId:", folderId);
        setError("Invalid folder ID. Please navigate from the test panel.");
        message.error("Invalid folder ID. Please navigate from the test panel.");
        setLoading(false);
        // Navigate back to test panel
        setTimeout(() => navigate(-1), 2000);
        return;
      }

      try {
        setLoading(true);
        setError(null); // Clear previous errors
        console.log("Fetching folder contents for ID:", folderId);
        
        const { data } = await api.get(`/testPanel/folders/${folderId}`);

        console.log("Fetched Quiz Details Data:", data);
        setFolderContents(data.folder);
      } catch (err) {
        console.error("Error fetching folder contents:", err);
        const errorMsg = err.response?.data?.message || 
                        err.response?.data?.error || 
                        "Failed to load folder contents";
        setError(errorMsg);
        message.error(errorMsg);
        
        // If it's a 400 error (invalid ID), navigate back
        if (err.response?.status === 400) {
          setTimeout(() => navigate(-1), 2000);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchFolderContents();
  }, [folderId, navigate]);

  const fetchQuizHistory = async (quizId) => {
    if (quizHistories[quizId]) return;

    try {
      const { data } = await api.get(`/quizzes/${quizId}/history`);
      console.log("Quiz History Data:", data);
      setQuizHistories((prev) => ({ ...prev, [quizId]: data }));
    } catch (err) {
      message.error(
        err.response?.data?.message || "Error fetching quiz history"
      );
    }
  };

  const handleGiveTest = async (quizId, firstTestId) => {
    try {
      setLoading(true);

      const { data } = await api.post(`/quizzes/${quizId}/validate`);
      



      if (data.success) {
        notification.success({
          message: "Quiz Ready",
          description: (
            <>
              <p>
                <strong>Max Attempts:</strong> {data.quizDetails.maxAttempts}
              </p>
              <p>
                <strong>Current Attempts:</strong>{" "}
                {data.quizDetails.currentAttempts}
              </p>
              <p>
                <strong>Remaining Attempts:</strong>{" "}
                {data.quizDetails.maxAttempts -
                  data.quizDetails.currentAttempts}
              </p>
            </>
          ),
          placement: "topRight",
          duration: 5,
        });
        navigate(`/give-test/${quizId}`, { state: { firstTestId } });
      } else {
        notification.error({
          message: "Quiz Not Available",
          description: data.message || "Unable to start quiz.",
          placement: "topRight",
          duration: 5,
        });
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to validate quiz start";
      notification.error({
        message: "Quiz Start Error",
        description: errorMsg,
        placement: "topRight",
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  const showAttemptDetails = (attempt) => {
    setSelectedAttempt(attempt);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <LoadingSpinner 
        size="large" 
        tip="Loading test details..." 
        style={{ minHeight: '400px' }}
      />
    );
  }

  if (error) {
    return (
      <Result
        icon={<ExclamationCircleOutlined />}
        title="Failed to Load Test Details"
        subTitle={error}
        extra={[
          <Button 
            type="primary" 
            icon={<ArrowLeftOutlined />}
            key="back" 
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>,
          <Button 
            key="retry" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        ]}
      />
    );
  }

  const items = [
    ...(folderContents.subFolders || []).map((f) => ({ ...f, type: "folder" })),
    ...(folderContents.quizzes || []).map((q) => ({ ...q, type: "quiz" })),
  ];
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <BookOutlined className="text-xl" />
          </div>
          <Title level={2} className="!mb-0 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {folderContents.name || "Test Panel"}
          </Title>
        </div>
        <Text type="secondary" className="text-base">
          Select a quiz to test your knowledge and track your progress
        </Text>
      </div>

      {items.length ? (
        <Row gutter={[24, 24]}>
          {items.map((item) => (
            <Col xs={24} sm={12} lg={8} key={item._id}>
              <Card
                hoverable
                className="quiz-card h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
                bodyStyle={{ 
                  padding: "24px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${
                      item.type === "folder" 
                        ? "bg-white text-black border border-gray-200" 
                        : "bg-purple-50 text-purple-500"
                    }`}>
                      {item.type === "folder" ? (
                        <FolderOutlined className="text-xl" />
                      ) : (
                        <RocketOutlined className="text-xl" />
                      )}
                    </div>
                    <div>
                      <Title level={4} className="!mb-1 !text-gray-800 font-bold">
                        {item.name || item.quizName}
                      </Title>
                      {item.type === "quiz" && (
                        <div className="flex items-center gap-2">
                          <ClockCircleOutlined className="text-gray-500" />
                          <Text className="text-gray-600 font-medium">
                            {item.duration.hours > 0 && `${item.duration.hours} hrs `}
                            {item.duration.minutes > 0 && `${item.duration.minutes} min`}
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>
                  {item.type === "quiz" && (
                    <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                      <StarOutlined className="text-blue-500" />
                      <Text className="text-blue-700 font-semibold text-sm">
                        {item.maxAttempts} attempts
                      </Text>
                    </div>
                  )}
                </div>
                {/* Quiz Content */}
                {item.type === "quiz" && (
                  <div className="flex-1 flex flex-col">
                    {/* Quiz Stats */}
                    <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrophyOutlined className="text-yellow-500" />
                          <Text className="text-gray-700 font-semibold">Max Attempts</Text>
                        </div>
                        <Text className="text-gray-800 font-bold text-lg">{item.maxAttempts}</Text>
                      </div>
                    </div>

                    {/* Attempt History */}
                    <div className="mb-6 flex-1">
                      <Collapse 
                        ghost 
                        className="custom-collapse-white"
                        style={{ 
                          backgroundColor: 'transparent',
                          border: 'none'
                        }}
                      >
                        <Panel
                          header={
                            <div className="flex items-center gap-2">
                              <FireOutlined className="text-orange-500" />
                              <Text className="text-gray-700 font-semibold">Attempt History</Text>
                            </div>
                          }
                          key={item._id}
                          onClick={() => fetchQuizHistory(item._id)}
                          style={{ 
                            backgroundColor: '#f9fafb',
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb',
                            marginBottom: '8px'
                          }}
                        >
                          <div className="space-y-3">
                            {quizHistories[item._id]?.attempts?.length > 0 ? (
                              quizHistories[item._id].attempts.map((attempt, index) => (
                                <div 
                                  key={index} 
                                  className="p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-full ${
                                        attempt.completed 
                                          ? 'bg-green-100 text-green-600' 
                                          : 'bg-red-100 text-red-600'
                                      }`}>
                                        {attempt.completed ? (
                                          <CheckCircleOutlined />
                                        ) : (
                                          <CloseCircleOutlined />
                                        )}
                                      </div>
                                      <div>
                                        <Text className="text-gray-800 font-semibold">
                                          Attempt {attempt.attemptNumber}
                                        </Text>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Tag 
                                            color={attempt.completed ? "success" : "error"}
                                            className="!text-xs"
                                          >
                                            {attempt.status.toUpperCase()}
                                          </Tag>
                                          <Text className="text-gray-600 font-bold">
                                            {attempt.score.percentage}%
                                          </Text>
                                        </div>
                                      </div>
                                    </div>
                                    <Button
                                      type="text"
                                      size="small"
                                      className="text-blue-600 hover:bg-blue-50"
                                      onClick={() => showAttemptDetails(attempt)}
                                    >
                                      View Details
                                    </Button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-6">
                                <div className="p-4 rounded-full bg-gray-100 inline-block mb-3">
                                  <BookOutlined className="text-2xl text-gray-400" />
                                </div>
                                <Text className="text-gray-500 block">
                                  No attempts yet. Start your first quiz!
                                </Text>
                              </div>
                            )}
                          </div>
                        </Panel>
                      </Collapse>
                    </div>

                    {/* Start Quiz Button */}
                    <Button
                      block
                      type="primary"
                      size="large"
                      className="font-bold py-3 h-auto rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                      onClick={() => handleGiveTest(item._id, firstTestId)}
                      icon={<PlayCircleOutlined className="text-lg" />}
                    >
                      Start Quiz Challenge
                    </Button>
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <div className="text-center py-16">
          <div className="p-6 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 inline-block mb-6">
            <BookOutlined className="text-6xl text-gray-400" />
          </div>
          <Title level={3} className="!text-gray-600 !mb-2">
            No Quizzes Available
          </Title>
          <Text type="secondary" className="text-lg">
            There are no quizzes in this folder yet. Check back later for new challenges!
          </Text>
        </div>
      )}

      {/* Enhanced Attempt Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <TrophyOutlined />
            </div>
            <span className="text-xl font-bold text-gray-800">Attempt Details</span>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={900}
        className="attempt-details-modal"
      >
        {selectedAttempt ? (
          <div className="space-y-6">
            {/* Score Overview Cards */}
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card className="text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <div className="p-4">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      #{selectedAttempt.attemptNumber}
                    </div>
                    <Text className="text-blue-800 font-medium">Attempt Number</Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <div className="p-4">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {selectedAttempt.score.percentage}%
                    </div>
                    <Text className="text-green-800 font-medium">
                      {selectedAttempt.score.obtained} / {selectedAttempt.score.total} Points
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <div className="p-4">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {selectedAttempt.questions.correct}
                    </div>
                    <Text className="text-purple-800 font-medium">
                      Correct out of {selectedAttempt.questions.total}
                    </Text>
                  </div>
                </Card>
              </Col>
            </Row>
            {/* Question Details Table */}
            <div className="mt-6">
              <Title level={4} className="mb-4 flex items-center gap-2">
                <BookOutlined className="text-blue-500" />
                Question Breakdown
              </Title>
              <Table
                dataSource={selectedAttempt.questionDetails}
                columns={[
                  {
                    title: "Question",
                    dataIndex: "questionText",
                    key: "questionText",
                    width: "60%",
                    render: (text) => (
                      <Text className="text-gray-700">{text}</Text>
                    ),
                  },
                  {
                    title: "Result",
                    dataIndex: "isCorrect",
                    key: "isCorrect",
                    width: "20%",
                    align: "center",
                    render: (correct) => (
                      <div className="flex items-center justify-center">
                        {correct ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircleOutlined />
                            <Text className="text-green-600 font-semibold">Correct</Text>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600">
                            <CloseCircleOutlined />
                            <Text className="text-red-600 font-semibold">Wrong</Text>
                          </div>
                        )}
                      </div>
                    ),
                  },
                  {
                    title: "Marks",
                    dataIndex: "marksObtained",
                    key: "marksObtained",
                    width: "20%",
                    align: "center",
                    render: (marks, record) => (
                      <Text className={`font-bold ${marks > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {marks} / {record.maxMarks || 1}
                      </Text>
                    ),
                  },
                ]}
                pagination={false}
                className="custom-table"
                rowClassName={(record) => 
                  record.isCorrect ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'
                }
                rowKey="questionId"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <LoadingSpinner size="large" tip="Loading attempt details..." />
          </div>
        )}
      </Modal>
    </div>
  );
};

const TestDetailsWithErrorBoundary = () => {
  return (
    <ErrorBoundary>
      <TestDetails />
    </ErrorBoundary>
  );
};

export default HOC(TestDetailsWithErrorBoundary);
