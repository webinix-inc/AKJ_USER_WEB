import React, { useState, useEffect, useCallback } from 'react';
import { List, Card, Spin, Alert, Button, Modal, Pagination } from 'antd';

import api from '../../../api/axios';
import { format } from 'date-fns'; // Assuming you've installed date-fns

const NotificationComponent = ({ courseId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' }) => {
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const fetchNotifications = useCallback(async (currentPage) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/notification/course/${courseId}`, {
        params: {
          page: currentPage,
          limit,
          sortBy,
          sortOrder
        }
      });
      setNotifications(data.notifications);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch course notifications:', error);
      setError(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [courseId, limit, sortBy, sortOrder]);

  useEffect(() => {
    if (courseId) {
      fetchNotifications(page);
    }
  }, [courseId, page, fetchNotifications]);

  const showModal = (notification) => {
    setSelectedNotification(notification);
    setVisible(true);
  };

  const closeModal = () => {
    setVisible(false);
  };

  const handlePageChange = (page, pageSize) => {
    fetchNotifications(page);
  };

  if (loading) return (
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-20"></div>
        ))}
      </div>
    </div>
  );
  if (error) return <Alert message="Error" description={error} type="error" showIcon />;

  return (
    <>
      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={notifications}
        renderItem={notification => (
          <List.Item onClick={() => showModal(notification)}>
            <Card hoverable title={notification.title}>
              <p>{notification.message}</p>
              <p>{format(new Date(notification.createdAt), 'PPpp')}</p> {/* Formatting date here */}
            </Card>
          </List.Item>
        )}
      />
      <Pagination
        current={page}
        pageSize={limit}
        total={total}
        onChange={handlePageChange}
        style={{ marginTop: '20px', textAlign: 'center' }}
      />
      {selectedNotification && (
        <Modal
          title={selectedNotification.title}
          visible={visible}
          onOk={closeModal}
          onCancel={closeModal}
          footer={[
            <Button key="close" onClick={closeModal}>
              Close
            </Button>
          ]}
        >
          <p>{selectedNotification.message}</p>
        </Modal>
      )}
    </>
  );
};

export default NotificationComponent;