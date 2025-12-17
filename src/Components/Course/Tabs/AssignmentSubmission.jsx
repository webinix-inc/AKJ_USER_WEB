import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Upload, 
  message, 
  List, 
  Tag, 
  Typography, 
  Space,
  Divider,
  Empty,
  Spin
} from 'antd';
import { 
  UploadOutlined, 
  PlusOutlined, 
  FileOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import api from '../../../api/axios';
import PDFViewer from '../../PdfViewer/PDFViewer';
import { useUser } from '../../../Context/UserContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const AssignmentSubmission = ({ courseId, rootFolderId }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const { userData } = useUser();
  
  // PDF Viewer state
  const [previewFile, setPreviewFile] = useState(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  useEffect(() => {
    if (!hasLoaded) {
      fetchAssignments();
    }
  }, []); // Empty dependency array to run only once on mount

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/assignments');
      if (response.data.status === 200) {
        // Filter assignments for current course
        const courseAssignments = response.data.data.filter(
          assignment => assignment.courseRootFolder?._id === rootFolderId
        );
        
        setAssignments(courseAssignments);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      message.error('Failed to load assignments');
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      
      const formData = new FormData();
      formData.append('courseId', rootFolderId);
      formData.append('assignmentTitle', values.assignmentTitle);
      formData.append('assignmentDescription', values.assignmentDescription || '');
      formData.append('studentNotes', values.studentNotes || '');
      
      // Add files
      fileList.forEach(file => {
        if (file.originFileObj) {
          formData.append('assignmentFiles', file.originFileObj);
        }
      });

      const response = await api.post('/user/assignments/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 201) {
        message.success('Assignment submitted successfully!');
        setSubmitModalVisible(false);
        form.resetFields();
        setFileList([]);
        console.log('✅ [DEBUG] Assignment submitted, refreshing list...');
        fetchAssignments(); // Refresh the list
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      message.error(error.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const uploadProps = {
    fileList,
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
    beforeUpload: (file) => {
      const isValidType = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 
                          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
                          .includes(file.type);
      
      if (!isValidType) {
        message.error('Only images, PDF, and Word documents are allowed!');
        return false;
      }
      
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('File must be smaller than 10MB!');
        return false;
      }
      
      return false; // Prevent auto upload
    },
    multiple: true,
    maxCount: 5,
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      submitted: { color: 'blue', icon: <ClockCircleOutlined />, text: 'Submitted' },
      reviewed: { color: 'orange', icon: <EyeOutlined />, text: 'Reviewed' },
      graded: { color: 'green', icon: <CheckCircleOutlined />, text: 'Graded' }
    };
    
    const config = statusConfig[status] || statusConfig.submitted;
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const handleFileView = async (file) => {
    console.log('🔍 [DEBUG] Opening assignment file:', file);
    
    try {
      // Create a file object that matches the expected format for the streaming system
      const fileObject = {
        _id: file.fileId || file._id, // Use fileId if available, fallback to _id
        name: file.fileName,
        url: file.fileUrl,
        type: file.fileType
      };

      // Generate secure token for the file
      const { data } = await api.post("/stream/generate-token", {
        fileId: fileObject._id,
      });

      let secureUrl;
      if (data.isDirectUrl) {
        secureUrl = data.signedUrl;
      } else {
        secureUrl = `${api.defaults.baseURL}/stream/${data.token}`;
      }

      const fileExtension = file.fileName.split('.').pop().toLowerCase();
      
      if (fileExtension === 'pdf') {
        // For PDFs, fetch and create blob URL for PDF viewer
        const response = await fetch(secureUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        setPreviewFile({
          ...fileObject,
          secureUrl: blobUrl,
          type: 'pdf'
        });
        setPreviewModalVisible(true);
      } else {
        // For other files, open in new tab
        window.open(secureUrl, '_blank');
      }
    } catch (error) {
      console.error('Error opening assignment file:', error);
      message.error('Failed to open file. Please try again.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={3}>📝 Assignment Submissions</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setSubmitModalVisible(true)}
          size="large"
          className="bg-gradient-to-r from-blue-500 to-purple-600 border-none hover:from-blue-600 hover:to-purple-700"
        >
          Submit New Assignment
        </Button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <Empty
          description="No assignments submitted yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button 
            type="primary" 
            onClick={() => setSubmitModalVisible(true)}
          >
            Submit Your First Assignment
          </Button>
        </Empty>
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}
          dataSource={assignments}
          renderItem={(assignment) => (
            <List.Item>
              <Card
                hoverable
                title={
                  <div className="flex justify-between items-center">
                    <Text strong>{assignment.assignmentTitle}</Text>
                    {getStatusTag(assignment.submissionStatus)}
                  </div>
                }
                extra={
                  <Text type="secondary">
                    {new Date(assignment.createdAt).toLocaleDateString()}
                  </Text>
                }
              >
                <Space direction="vertical" className="w-full">
                  {assignment.assignmentDescription && (
                    <Paragraph ellipsis={{ rows: 2 }}>
                      {assignment.assignmentDescription}
                    </Paragraph>
                  )}
                  
                  <div>
                    <Text strong>Files Submitted: </Text>
                    <Text>{assignment.submittedFiles.length}</Text>
                  </div>
                  
                  {assignment.submittedFiles.length > 0 && (
                    <div>
                      <Text strong>Submitted Files:</Text>
                      <div className="mt-2 space-y-2">
                        {assignment.submittedFiles.map((file, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Button
                              type="link"
                              icon={<FileOutlined />}
                              onClick={() => handleFileView(file)}
                              className="p-0 h-auto text-blue-600 hover:text-blue-800"
                            >
                              {file.fileName}
                            </Button>
                            <Tag color="blue">{file.fileType}</Tag>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {assignment.adminReview?.comments && (
                    <>
                      <Divider />
                      <div>
                        <Text strong>Admin Feedback:</Text>
                        <Paragraph>{assignment.adminReview.comments}</Paragraph>
                        {assignment.adminReview.grade && (
                          <Tag color="gold">Grade: {assignment.adminReview.grade}</Tag>
                        )}
                      </div>
                    </>
                  )}
                </Space>
              </Card>
            </List.Item>
          )}
        />
      )}

      {/* Submit Assignment Modal */}
      <Modal
        title="📝 Submit New Assignment"
        visible={submitModalVisible}
        onCancel={() => {
          setSubmitModalVisible(false);
          form.resetFields();
          setFileList([]);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="assignmentTitle"
            label="Assignment Title"
            rules={[{ required: true, message: 'Please enter assignment title' }]}
          >
            <Input placeholder="Enter assignment title" size="large" />
          </Form.Item>

          <Form.Item
            name="assignmentDescription"
            label="Assignment Description"
          >
            <TextArea 
              rows={3} 
              placeholder="Describe your assignment (optional)"
            />
          </Form.Item>

          <Form.Item
            name="studentNotes"
            label="Additional Notes"
          >
            <TextArea 
              rows={2} 
              placeholder="Any additional notes for the instructor (optional)"
            />
          </Form.Item>

          <Form.Item
            label="Upload Files"
            extra="Upload images, PDF, or Word documents (max 5 files, 10MB each)"
          >
            <Upload.Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag files to this area to upload
              </p>
              <p className="ant-upload-hint">
                Support for images, PDF, and Word documents
              </p>
            </Upload.Dragger>
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setSubmitModalVisible(false)}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitting}
                size="large"
              >
                Submit Assignment
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* PDF Viewer Modal */}
      <Modal
        title={previewFile?.name || 'File Preview'}
        visible={previewModalVisible}
        onCancel={() => {
          setPreviewModalVisible(false);
          setPreviewFile(null);
          if (previewFile?.secureUrl && previewFile.secureUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewFile.secureUrl);
          }
        }}
        width="90%"
        style={{ top: 20 }}
        footer={null}
        className="pdf-viewer-modal"
      >
        {previewFile && previewFile.type === 'pdf' && (
          <PDFViewer 
            fileUrl={previewFile.secureUrl} 
            fileName={previewFile.name}
          />
        )}
      </Modal>
    </div>
  );
};

export default AssignmentSubmission;
