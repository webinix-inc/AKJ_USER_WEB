import { Divider, Layout, List, Space, Typography } from 'antd';
import React from 'react';
import FooterLanding from '../Landing Page/Footerlanding';
import NavbarLanding from '../Landing Page/NavbarLanding';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const Privacy = () => {
  return (
    <Layout style={{ minHeight: '100vh', marginTop: '70px', backgroundColor: '#f9f9f9' }}>
      {/* Navbar */}
      <NavbarLanding />

      {/* Main Content */}
      <Content style={{ padding: '50px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ background: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
          <Title level={1} style={{ textAlign: 'center', marginBottom: '20px' }}>
            Privacy Policy
          </Title>

          <Paragraph>
            At <Text strong>AKJ Classes</Text>, we prioritize the privacy of our users. This Privacy Policy outlines how we collect, use, and protect your personal data when you use our platform. By accessing our platform, you consent to the practices described in this policy.
          </Paragraph>

          <Divider />

          <Title level={2}>1. Information We Collect</Title>
          <Paragraph>
            We may collect the following types of information from users:
          </Paragraph>
          <List
            size="small"
            bordered
            dataSource={[
              'Personal Information: Name, email address, phone number, and billing details.',
              'Usage Data: IP address, browser type, and device information.',
              'Activity Data: Courses accessed, quiz results, and time spent on the platform.',
            ]}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />

          <Divider />

          <Title level={2}>2. How We Use Your Information</Title>
          <Paragraph>
            Your data is used for the following purposes:
          </Paragraph>
          <List
            size="small"
            bordered
            dataSource={[
              'To provide and improve our educational services.',
              'To communicate with you about updates, offers, and notifications.',
              'To process payments and verify transactions.',
              'To ensure the security and functionality of our platform.',
            ]}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />

          <Divider />

          <Title level={2}>3. Data Sharing and Disclosure</Title>
          <Paragraph>
            We do not sell or rent your personal information. However, we may share data with:
          </Paragraph>
          <List
            size="small"
            bordered
            dataSource={[
              'Service providers for payment processing and hosting services.',
              'Legal authorities if required by law.',
              'Third parties in case of a merger or acquisition.',
            ]}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />

          <Divider />

          <Title level={2}>4. Data Security</Title>
          <Paragraph>
            We implement robust security measures to protect your personal data. This includes encryption, secure servers, and access controls. However, no system is completely secure, and we cannot guarantee absolute protection.
          </Paragraph>

          <Divider />

          <Title level={2}>5. Your Rights</Title>
          <Paragraph>
            As a user, you have the following rights regarding your personal data:
          </Paragraph>
          <List
            size="small"
            bordered
            dataSource={[
              'Access: Request a copy of your personal data.',
              'Correction: Update incorrect or incomplete information.',
              'Deletion: Request deletion of your personal data.',
              'Restriction: Limit the use of your personal data.',
              'Objection: Opt-out of certain types of data processing.',
            ]}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />

          <Divider />

          <Title level={2}>6. Cookies and Tracking</Title>
          <Paragraph>
            We use cookies to enhance your user experience. Cookies are small files stored on your device that help us understand user behavior and improve our services. You can manage cookie preferences in your browser settings.
          </Paragraph>

          <Divider />

          <Title level={2}>7. Policy Updates</Title>
          <Paragraph>
            This Privacy Policy may be updated periodically to reflect changes in our practices or for legal compliance. Users will be notified of significant updates via email or platform announcements.
          </Paragraph>

          <Divider />

          <Title level={2}>8. Contact Information</Title>
          <Paragraph>
            For any questions or concerns regarding this Privacy Policy, please contact us:
          </Paragraph>
          <Space direction="vertical" size="small">
            <Text>
              <Text strong>Phone:</Text> <a href="tel:0 93212 96859 / 91361 90417">093212 96859 / 91361 90417</a>
            </Text>
            <Text>
              <Text strong>Email:</Text> <a href="mailto:privacy@.com">privacy@.com</a>
            </Text>
            <Text>
              <Text strong>Address:</Text> B-11 A, behind The Indian Express, B Block, Sector 10, Noida, Uttar Pradesh 201301
            </Text>
          </Space>

          <Paragraph style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#888' }}>
            By using our platform, you acknowledge that you have read and agree to this Privacy Policy.
          </Paragraph>
        </div>
      </Content>

      {/* Footer */}
      <FooterLanding />
    </Layout>
  );
};

export default Privacy;