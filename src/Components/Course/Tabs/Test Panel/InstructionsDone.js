import React, { useState, useEffect } from "react";
import {
  Layout,
  Typography,
  Card,
  Checkbox,
  Button,
  Divider,
  Row,
  Col,
  Badge,
  message,
  Spin,
} from "antd";
import { ClockCircleOutlined, StarOutlined } from "@ant-design/icons";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../../../../api/axios";
import { useUser } from "../../../../Context/UserContext";
import { FaUserCircle } from "react-icons/fa";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const Instruction = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const quizId = id;
  const { fetchUserProfile, profileData, loading: userLoading } = useUser(); // Fetch user profile using context
  const [quizDetails, setQuizDetails] = useState(null); // State to store quiz details
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false); // Checkbox state
  const [loading, setLoading] = useState(false); // Button loading state
  const [loadingQuiz, setLoadingQuiz] = useState(true); // Loading state for quiz details

  const location = useLocation();
  const folderId = location.state?.folderId; // Get folderId from location state

  // Fetch quiz details from the API
  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        setLoadingQuiz(true);
        const response = await api.get(`/admin/quizzes/${quizId}`);
        if (response.status === 200) {
          setQuizDetails(response.data.quiz); // Set the fetched quiz details
          console.log("Fetched Quiz Details:", response.data.quiz);
        }
      } catch (error) {
        console.error("Error fetching quiz details:", error);
        message.error("Failed to load quiz details. Please try again.");
      } finally {
        setLoadingQuiz(false);
      }
    };
    fetchQuizDetails();
  }, [quizId]);

  const formatDuration = (duration) => {
    if (
      typeof duration === "object" &&
      duration.hours !== undefined &&
      duration.minutes !== undefined
    ) {
      return `${duration.hours} hr ${duration.minutes} min`;
    }
    return "N/A";
  };

  const handleAttemptTest = async () => {
    setLoading(true);
    try {
      // Send request to start the quiz and fetch the scorecardId
      const response = await api.post(`/quizzes/${quizId}/start`);
      console.log("Quiz Start Response:", response.data);
      if (response.status === 201) {
        const { durationMinutes, attemptNumber, scorecardId } = response.data; // Get scorecardId from the response
        message.success(
          `Quiz started! Duration: ${durationMinutes} minutes, Attempt: ${attemptNumber}`
        );

        // Wait 5 seconds before navigating to exam page
        setTimeout(() => {
          navigate(`/exam-page/${quizId}`, {
            state: { scorecardId, folderId }, // Pass scorecardId via state to the exam page
          });
        }, 500);
      }
    } catch (error) {
      console.error("Error starting quiz:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to start the quiz. Please try again.";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingQuiz) {
    return (
      <Layout style={{ minHeight: "100vh", background: "#f9fafc" }}>
        <Content
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Spin size="large" tip="Loading Quiz Details..." />
        </Content>
      </Layout>
    );
  }

  if (!quizDetails) {
    return (
      <Layout style={{ minHeight: "100vh", background: "#f9fafc" }}>
        <Content
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography.Text type="danger">
            Quiz details could not be loaded.
          </Typography.Text>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh", background: "#f9fafc" }}>
      {/* Header */}

      <Header
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e8e8e8",
          padding: "0 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title
          level={5}
          style={{ margin: 0, fontWeight: "bold", fontSize: "25px" }}
        >
          {quizDetails.quizName} {/* Quiz Name from API */}
        </Title>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "25px",
          }}
        >
          {profileData?.image ? (
            <img
              src={profileData.image}
              alt={profileData.firstName + " " + profileData.lastName || "User"}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "1px solid #1890ff", // Adds a border
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)", // Adds a subtle shadow
              }}
            />
          ) : (
            <FaUserCircle style={{ fontSize: "40px", color: "#1890ff" }} />
          )}
          <Text style={{ fontSize: "18px", fontWeight: "500" }}>
            {profileData?.firstName + " " + profileData?.lastName || "User"}
          </Text>
        </div>
      </Header>

      {/* Content */}
      <Content
        style={{ padding: "24px", display: "flex", justifyContent: "center" }}
      >
        <Card style={{ width: "100%" }}>
          {/* Test Information */}
          <Row style={{ marginBottom: "16px" }} align="middle">
            <Col span={12}>
              <Title level={4} style={{ margin: 0 }}>
                Test Sections
              </Title>
            </Col>
            <Col span={12} style={{ textAlign: "right", color: "#8c8c8c" }}>
              <ClockCircleOutlined style={{ marginRight: "8px" }} />
              {formatDuration(quizDetails.duration)}
              <Divider type="vertical" />
              <StarOutlined style={{ marginRight: "8px" }} />
              {quizDetails.quizTotalMarks || "0"} marks
            </Col>
          </Row>

          <Divider />

          {/* Section Information */}
          <Row align="middle">
            <Col>
              <Badge
                count="1"
                style={{
                  backgroundColor: "#6a1b9a",
                  color: "#fff",
                  fontSize: "14px",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: "50%",
                }}
              />
            </Col>
            <Col style={{ marginLeft: "16px" }}>
              <Title level={5} style={{ margin: 0 }}>
                {quizDetails.createdAt
                  ? new Intl.DateTimeFormat("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(quizDetails.createdAt))
                  : "0"}
              </Title>
              <Text>
                {quizDetails.questions?.length || "0"} Quesation •{" "}
                {quizDetails.quizTotalMarks || "0"} marks
              </Text>
            </Col>
          </Row>

          <Divider />

          {/* Agreement Checkbox */}
          <Checkbox
            onChange={(e) => setIsCheckboxChecked(e.target.checked)}
            style={{ marginTop: "16px" }}
          >
            I have read and understood the instructions. I agree that in case of
            not adhering to the instructions, I shall be liable to be debarred
            from this test and/or disciplinary action, which may include a ban
            from future tests.
          </Checkbox>
        </Card>
      </Content>

      {/* Footer */}
      <Footer
        style={{
          textAlign: "center",
          background: "#fff",
          marginTop: "24px",
          borderTop: "1px solid #e8e8e8",
        }}
      >
        {/* Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            style={{
              height: "43px", // Adjust height here
              borderWidth: "1px", // Adjust border thickness here
            }}
            onClick={() => navigate(`/give-test/${quizId}`)}
          >
            Previous
          </Button>
          <Button
            type="primary"
            style={{
              height: "40px", // Adjust height here
              borderWidth: "1px", // Adjust border thickness here
            }}
            onClick={handleAttemptTest}
            disabled={!isCheckboxChecked || loading}
            loading={loading}
          >
            Attempt Test
          </Button>
        </div>
      </Footer>
    </Layout>
  );
};

export default Instruction;
