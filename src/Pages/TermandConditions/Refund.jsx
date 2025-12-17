import { Divider, Layout, List, Space, Typography } from 'antd';
import React from 'react';
import FooterLanding from '../Landing Page/Footerlanding';
import NavbarLanding from '../Landing Page/NavbarLanding';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const Refund = () => {
  return (
    <Layout style={{ minHeight: '100vh', marginTop: "70px", backgroundColor: '#f9f9f9' }}>
      {/* Navbar */}
      <NavbarLanding />

      {/* Main Content */}
      <Content style={{ padding: '50px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ background: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
          <Title level={1} style={{ textAlign: 'center', marginBottom: '20px' }}>
            Refund Policy
          </Title>

          <Paragraph>
            At <Text strong>AKJ Classes</Text>, we strive to provide high-quality educational courses and services. This Refund Policy explains the circumstances under which refunds may be provided, along with your rights and obligations as a user. By purchasing a course, you agree to the terms outlined below.
          </Paragraph>

          <Divider />

          <Title level={2}>1. Eligibility for Refund</Title>
          <Paragraph>
            Refunds are only applicable under the following conditions:
          </Paragraph>
          <List
            size="small"
            bordered
            dataSource={[
              'The course content is not delivered or is incomplete.',
              'Technical issues prevent access to the purchased course for more than 7 days, and we are unable to resolve them.',
              'Duplicate payments made due to technical errors.',
            ]}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />

          <Paragraph style={{ marginTop: '10px' }}>
            Refund requests must be initiated within <Text strong>7 days</Text> of the payment date.
          </Paragraph>

          <Divider />

          <Title level={2}>2. Non-Refundable Cases</Title>
          <Paragraph>
            Refunds will not be provided in the following scenarios:
          </Paragraph>
          <List
            size="small"
            bordered
            dataSource={[
              'If the course has been accessed or more than 20% of the content has been consumed.',
              'User dissatisfaction with teaching style, pace, or content coverage.',
              'Inability to complete the course within the specified duration due to personal reasons.',
              'Promotional offers, trial subscriptions, or free courses.',
            ]}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />

          <Divider />

          <Title level={2}>3. Refund Process</Title>
          <Paragraph>
            To request a refund, please follow these steps:
          </Paragraph>
          <List
            size="small"
            bordered
            dataSource={[
              'Submit a refund request by emailing us at refund@.com with the subject line "Refund Request".',
              'Include your full name, contact information, payment receipt, and a detailed reason for the refund request.',
              'Our support team will review your request and respond within 5 business days.',
            ]}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />

          <Paragraph style={{ marginTop: '10px' }}>
            Once approved, refunds will be processed within <Text strong>7–10 business days</Text>. The amount will be credited to the original payment method.
          </Paragraph>

          <Divider />

          <Title level={2}>4. Legal Framework</Title>
          <Paragraph>
            This Refund Policy complies with the following legal provisions under Indian law:
          </Paragraph>
          <List
            size="small"
            bordered
            dataSource={[
              'Section 2(1)(d) of the Consumer Protection Act, 2019, which defines consumer rights for refunds and redressal.',
              'Section 12 of the Consumer Protection Act, 2019, which covers filing complaints for grievance redressal.',
              'Information Technology Act, 2000, for digital transactions and online commerce regulations.',
            ]}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />

          <Paragraph>
            Users are entitled to legal recourse through the appropriate Consumer Court or forum if they feel their refund claim is unfairly denied.
          </Paragraph>

          <Divider />

          <Title level={2}>5. Contact Information</Title>
          <Paragraph>
            If you have any questions or concerns regarding this Refund Policy, please contact us:
          </Paragraph>
          <Space direction="vertical" size="small">
            <Text>
              <Text strong>Phone:</Text> <a href="tel:0 93212 96859 / 91361 90417">093117 99232</a>
            </Text>
            <Text>
              <Text strong>Email:</Text> <a href="mailto:refund@.com">refund@.com</a>
            </Text>
            <Text>
              <Text strong>Address:</Text> B-11 A, behind The Indian Express, B Block, Sector 10, Noida, Uttar Pradesh 201301
            </Text>
          </Space>

          <Paragraph style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#888' }}>
            By purchasing a course from AKJ Classes, you agree to the terms of this Refund Policy.
          </Paragraph>
        </div>
      </Content>

      {/* Footer */}
      <FooterLanding />
    </Layout>
  );
};

export default Refund;