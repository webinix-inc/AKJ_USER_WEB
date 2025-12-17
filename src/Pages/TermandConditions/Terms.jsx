import { Divider, Layout, List, Space, Typography } from 'antd';
import React from 'react';
import FooterLanding from '../Landing Page/Footerlanding';
import NavbarLanding from '../Landing Page/NavbarLanding';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const Terms = () => {
  return (
    <Layout style={{ minHeight: '100vh', marginTop: "70px" , backgroundColor: '#f9f9f9' }}>
      {/* Navbar */}
      <NavbarLanding />

      {/* Main Content */}
      <Content style={{ padding: '50px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ background: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
          <Title level={1} style={{ textAlign: 'center', marginBottom: '20px' }}>
            Terms and Conditions
          </Title>

          <Paragraph>
            Welcome to <Text strong>AKJ Classes</Text>, an educational institution based in Noida, Uttar Pradesh. By accessing and using our platform or services, you agree to the following Terms and Conditions. Please read them carefully. If you do not accept these terms, refrain from using our platform.
          </Paragraph>

          <Divider />

          <Title level={2}>1. Definitions</Title>
          <List
            size="small"
            bordered
            dataSource={[
              'Platform: Refers to the AKJ Classes website and related services.',
              'Content: Includes educational resources such as courses, PDFs, quizzes, and videos.',
              'User: Any individual who accesses or interacts with the platform.',
            ]}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />

          <Divider />

          <Title level={2}>2. Location and Hours</Title>
          <Paragraph>
            <Text strong>Address:</Text> B-11 A, behind The Indian Express, B Block, Sector 10, Noida, Uttar Pradesh 201301
          </Paragraph>
          <Paragraph>
            <Text strong>Hours:</Text> Closed ⋅ Opens 11:00 AM on Monday
          </Paragraph>
          <Paragraph>
            <Text strong>Phone:</Text> <a href="tel:0 93212 96859 / 91361 90417">093117 99232</a>
          </Paragraph>

          <Divider />

          <Title level={2}>3. Eligibility</Title>
          <Paragraph>
            Users must be at least <Text strong>13 years old</Text> to register or use our services. By registering, you confirm that you meet this age requirement.
          </Paragraph>

          <Divider />

          <Title level={2}>4. User Responsibilities</Title>
          <List
            size="small"
            bordered
            dataSource={[
              'Providing accurate and updated information during registration.',
              'Maintaining confidentiality of your account credentials.',
              'Avoiding any unauthorized access or misuse of the platform.',
            ]}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />

          <Divider />

          <Title level={2}>5. Payments and Refunds</Title>
          <Paragraph>
            Payments for courses are non-refundable unless explicitly stated otherwise. Refunds, when applicable, are processed within 7-10 business days after approval.
          </Paragraph>

          <Divider />

          <Title level={2}>6. Code of Conduct</Title>
          <Paragraph>
            Users must adhere to a code of conduct that ensures a positive learning environment. Harassment, cheating, or any disruptive behavior will lead to immediate account suspension.
          </Paragraph>

          <Divider />

          <Title level={2}>7. Intellectual Property</Title>
          <Paragraph>
            All intellectual property rights related to the platform and its content belong to <Text strong>AKJ Classes</Text>. Unauthorized use, reproduction, or distribution of content is prohibited.
          </Paragraph>

          <Divider />

          <Title level={2}>8. Dispute Resolution</Title>
          <Paragraph>
            Disputes shall be resolved through arbitration in accordance with Indian law. The arbitration venue will be <Text strong>Noida, Uttar Pradesh</Text>.
          </Paragraph>

          <Divider />

          <Title level={2}>9. Privacy Policy</Title>
          <Paragraph>
            Please refer to our <a href="/privacy" style={{ color: '#1890ff' }}>Privacy Policy</a> for details on how we handle user data.
          </Paragraph>

          <Divider />

          <Title level={2}>10. Contact Information</Title>
          <Space direction="vertical" size="small">
            <Text>
              <Text strong>Phone:</Text> <a href="tel:0 93212 96859 / 91361 90417">093117 99232</a>
            </Text>
            <Text>
              <Text strong>Email:</Text> <a href="mailto:support@.com">support@.com</a>
            </Text>
            <Text>
              <Text strong>Address:</Text> B-11 A, behind The Indian Express, B Block, Sector 10, Noida, Uttar Pradesh 201301
            </Text>
          </Space>

          <Paragraph style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#888' }}>
            By accessing our services, you agree to abide by these terms and conditions.
          </Paragraph>
        </div>
      </Content>

      {/* Footer */}
      <FooterLanding />
    </Layout>
  );
};

export default Terms;