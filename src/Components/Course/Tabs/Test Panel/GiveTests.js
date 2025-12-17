import React, { useEffect, useState } from "react";
import { Layout, Typography, Button, Divider, Space, Spin } from "antd";
import { FaUserCircle } from "react-icons/fa";
import { RightOutlined } from "@ant-design/icons";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { useUser } from "../../../../Context/UserContext";
import api from "../../../../api/axios";

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const TestPanel = () => {
  const navigate = useNavigate(); // Use useNavigate hook for navigation
  const { id } = useParams(); // Use quizId from params

  const locatiom = useLocation();
  const folderId = locatiom.state?.firstTestId; // Get folderId from location state

  const quizId = id;
  console.log("Print the quize id:", quizId);
  const { fetchUserProfile, profileData, loading: userLoading } = useUser(); // Fetch user profile using context
  const [quizDetails, setQuizDetails] = useState(null); // State to hold quiz details
  const [loading, setLoading] = useState(true); // Loading state for quiz details
  const [error, setError] = useState(null); // Error state for quiz details

  // Fetch quiz details from API
  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        const response = await api.get(`/admin/quizzes/${quizId}`);
        setQuizDetails(response.data.quiz); // Set quiz details from API response
        setLoading(false); // Stop loading
      } catch (err) {
        setError("Failed to fetch quiz details"); // Set error message
        setLoading(false); // Stop loading
      }
    };

    fetchQuizDetails();
    fetchUserProfile(); // Fetch user profile when the component mounts
  }, [quizId, fetchUserProfile]);

  if (loading || userLoading) {
    return (
      <Layout
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" tip="Loading data..." />
      </Layout>
    );
  }

  console.log("Print user details:", quizDetails);
  console.log("Print Quize details details:", profileData);

  if (error) {
    return (
      <Layout
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Title level={4} type="danger">
          {error}
        </Title>
      </Layout>
    );
  }

  return (
    <Layout style={{ height: "100vh", backgroundColor: "#f4f5f7" }}>
      {/* Header Section */}
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
        <Title level={5} style={{ margin: 0, fontWeight: "bold", fontSize: "25px" }}>
          {quizDetails.quizName} {/* Quiz Name from API */}
        </Title>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "25px" }}>
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

      {/* Content Section */}
      <Content style={{ padding: "20px", overflowY: "auto" }}>
        <Title level={4} style={{ marginBottom: "20px" }}>
          General Instructions
        </Title>
        <Divider style={{ marginBottom: "20px" }} />
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)",
            lineHeight: "1.8",
          }}
        >
          <Paragraph>
            <Text>
              * This is a timed test; the running time is displayed on top left
              corner of the screen.
            </Text>
          </Paragraph>
          <Paragraph>
            <Text>
              * The bar above the question text displays the question numbers in
              the current section of the test. You can move to any question by
              clicking on the respective number.
            </Text>
          </Paragraph>
          <Paragraph>
            <Text>
              * The question screen displays the question number along with the
              question and respective options.
            </Text>
          </Paragraph>
          <Paragraph>
            <Text>
              * The top right of section above the question has an option to
              mark the question for review. You can later view the marked
              question.
            </Text>
          </Paragraph>
          <Paragraph>
            <Text>
              * You can mark or unmark any option you have chosen by tapping on
              the respective option.
            </Text>
          </Paragraph>
          <Paragraph>
            <Text>
              * The bottom left corner contains the option to move to the
              previous question.
            </Text>
          </Paragraph>
          <Paragraph>
            <Text>
              * The bottom right corner contains the option to move to the next
              question.
            </Text>
          </Paragraph>
          <Paragraph>
            <Text>
              * You can jump between sections (if allowed by tutor) by choosing
              the section in bottom center drop down.
            </Text>
          </Paragraph>
          <Paragraph>
            <Text>
              * You can submit the test at any point of time by clicking the
              Submit button on top right corner of the screen.
            </Text>
          </Paragraph>
          <Paragraph>
            <Text>
              * Before submission, the screen shows a confirmation pop-up with
              the total number of questions in the test, questions answered and
              questions marked for review.
            </Text>
          </Paragraph>
          <Paragraph>
            <Text>
              * Test must be completed in one attempt. Test once submitted
              cannot be re-attempted or started again.
            </Text>
          </Paragraph>
          <Paragraph>
            <Text>
              * You should not change or close the test screen while attempting
              test.
            </Text>
          </Paragraph>
          <Paragraph>
            <Text>
              * If the app is closed or screen is changed more than three times
              by any means, the test will be submitted automatically.
            </Text>
          </Paragraph>
          <Paragraph>
            <Text>
              * After completion of test, a test summary screen will be
              displayed with section details & solutions.
            </Text>
          </Paragraph>
        </div>
      </Content>

      {/* Footer Section */}
      <Footer
        style={{ textAlign: "right", background: "#fff", marginTop: "24px", borderTop: "1px solid #e8e8e8", }}
      >
        <Space>
          <Button
            type="primary"
            onClick={() => navigate(`/instruction/${quizId}`, { state: { folderId } } )} // Corrected navigation logic
            icon={<RightOutlined />}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "43px", // Adjust height here
              borderWidth: "1px", // Adjust border thickness here
            }}
          >
            Next
          </Button>
        </Space>
      </Footer>
    </Layout>
  );
};

export default TestPanel;
