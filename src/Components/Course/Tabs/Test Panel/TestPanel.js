import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Row, Col, Typography, message, Spin, Result, Button } from "antd";
import { FolderOutlined, ExclamationCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import HOC from "../../../HOC/HOC";
import api from "../../../../api/axios";
import LoadingSpinner from "../../../Common/LoadingSpinner";
import ErrorBoundary from "../../../Common/ErrorBoundary";

const { Title, Text } = Typography;

const TestPanel = () => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const navigate = useNavigate();

  

  // FIX: Reduce excessive logging and optimize folder fetching
useEffect(() => {
  const fetchFolders = async () => {
    // Skip if already loaded to prevent unnecessary API calls
    if (hasLoaded) return;
    
    setLoading(true);
    try {
      const response = await api.get("/testPanel/folders");

      const allFolders = Array.isArray(response.data.folders)
        ? response.data.folders
        : [];

      if (!allFolders.length) {
        setFolders([]);
        message.info("No test folders available yet.");
        return;
      }
      
      // Filter visible folders and validate data
      const visibleFolders = allFolders.filter((folder) => {
        if (!folder || !folder._id) {
          return false;
        }
        return folder.isVisible;
      });
      
      setFolders(visibleFolders);
      
      if (visibleFolders.length === 0) {
        message.info("No visible test folders available.");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 
                      error.response?.data?.error || 
                      "Failed to load test folders";
      setError(errorMsg);
      message.error(errorMsg);
      setFolders([]);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  fetchFolders();
}, []); // Empty dependency array to run only once on mount


  const handleFolderClick = (folder) => {

    // Validate folder data before navigation
    if (!folder || !folder._id) {
      message.error("Invalid folder data");
      return;
    }

    if (folder.courses && folder.courses.length > 0) {
      const firstTest = folder.courses[0];
      
      // Validate test data
      if (!firstTest || !firstTest._id) {
        message.error("Invalid test data in folder");
        return;
      }
      
      console.log("Navigating to first test:", folder._id, firstTest._id);
      
      // Ensure we're passing valid IDs with additional folder metadata
      const navigationState = {
        folderId: folder._id.toString(), // Ensure it's a string
        firstTestId: firstTest._id.toString(),
        folderName: folder.name || "Unknown Folder",
        folderPath: folder.path || "", // Include folder path for better navigation
        parentFolderId: folder.parentId || null // Include parent folder reference
      };
      
      console.log("Navigation state:", navigationState);
      navigate(`/test/${firstTest._id}`, { state: navigationState });
    } else {
      message.warning("No tests available in this folder.");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Result
        icon={<ExclamationCircleOutlined />}
        title="Failed to Load Test Folders"
        subTitle={error}
        extra={[
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            key="retry" 
            onClick={() => {
              setError(null);
              setLoading(true);
              // Trigger refetch by updating the effect dependency
              window.location.reload();
            }}
          >
            Retry
          </Button>
        ]}
      />
    );
  }

  if (!folders || folders.length === 0) {
    return (
      <Result
        icon={<FolderOutlined />}
        title="No Test Folders Available"
        subTitle="There are no test folders visible at the moment. Please check back later or contact your instructor."
        extra={[
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            key="refresh" 
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        ]}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="p-6">
        <Row gutter={[24, 24]} style={{ justifyContent: "flex-start" }}>
          {folders.map((folder) => (
            <Col xs={24} sm={12} md={8} lg={6} key={folder._id}>
              <Card
                hoverable
                onClick={() => handleFolderClick(folder)}
                cover={
                  <div className="flex justify-center items-center py-6 pl-6 bg-white">
                    <FolderOutlined
                      style={{ fontSize: "48px", color: "#000000" }}
                    />
                  </div>
                }
              >
                <Title level={5}>{folder.name || "Unnamed Folder"}</Title>
                <Text type="secondary">
                  {folder.description || "No description available"}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </ErrorBoundary>
  );
};

export default TestPanel;
