import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Timeline,
  Card,
  Radio,
  Button,
  Typography,
  Row,
  Col,
  Divider,
} from "antd";
import { useSubscription } from "../../Context/SubscriptionContext";
import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { usePayment } from "../../Context/PaymentContext"; // Use Payment Context

const { Title, Text } = Typography;

const BuyNowPage1 = () => {
  const location = useLocation();
  const { courseId, selectedValidity, fullPayAmount } = location.state;
  const { fetchInstallments, installments, loading, error } = useSubscription();
  const [filteredInstallments, setFilteredInstallments] = useState([]);
  const [paymentOption, setPaymentOption] = useState("full");
  const [showInstallments, setShowInstallments] = useState(false);
  const {
    createOrder,
    initiatePayment,
    loading: paymentLoading,
  } = usePayment(); // Use context functions

  useEffect(() => {
    const fetchData = async () => {
      await fetchInstallments(courseId);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (installments.length > 0) {
      const filtered = installments.filter((installment) => {
        const planMonths = parseInt(installment.planType.split(" ")[0], 10);
        return planMonths === selectedValidity;
      });
      setFilteredInstallments(filtered);
    }
  }, [installments, selectedValidity]);

  const handlePaymentOptionChange = (e) => {
    setPaymentOption(e.target.value);
    setShowInstallments(e.target.value === "installments");
  };

  // Razorpay payment handler
  const handleBuyNow = async () => {
    try {
      const orderData = await createOrder(fullPayAmount); // Pass the correct amount

      const paymentResponse = await initiatePayment(orderData); // Use the initiatePayment method
      console.log(paymentResponse);
      alert("Payment successful:", paymentResponse);
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please try again.");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="payment-container" style={{ padding: "20px" }}>
      <Title level={4} className="text-center" style={{ marginBottom: "20px" }}>
        Choose Payment Option
      </Title>

      <Radio.Group
        onChange={handlePaymentOptionChange}
        value={paymentOption}
        className="payment-radio-group"
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Radio.Button value="full">Full Payment</Radio.Button>
        <Radio.Button value="installments">Installments</Radio.Button>
      </Radio.Group>

      <Row gutter={[16, 16]}>
        {/* Full Payment Card */}
        <Col xs={24} md={12}>
          <Card
            bordered={false}
            style={{
              borderRadius: "12px",
              backgroundColor: paymentOption === "full" ? "#f0f2f5" : "#fafafa",
              boxShadow:
                paymentOption === "full"
                  ? "0 4px 12px rgba(0,0,0,0.1)"
                  : "none",
            }}
          >
            <Title level={5}>Full Payment</Title>
            <div className="payment-info">
              <Text>Subscription fee</Text>
              <Text strong>INR {fullPayAmount}</Text>
            </div>
            <Divider />
            <div className="payment-info">
              <Text strong>Total (incl. of all taxes)</Text>
              <Text strong>INR {fullPayAmount}</Text>
            </div>
            <Button
              type="primary"
              block
              style={{ marginTop: "20px", borderRadius: "8px" }}
              onClick={handleBuyNow}
              loading={paymentLoading}
            >
              Buy Now
            </Button>
          </Card>
        </Col>

        {/* Installments Card */}
        <Col xs={24} md={12}>
          <Card
            bordered={false}
            style={{
              borderRadius: "12px",
              backgroundColor:
                paymentOption === "installments" ? "#f0f2f5" : "#fafafa",
              boxShadow:
                paymentOption === "installments"
                  ? "0 4px 12px rgba(0,0,0,0.1)"
                  : "none",
            }}
          >
            <Title level={5}>Pay in Installments</Title>
            <Text type="secondary">
              Running out of budget? Pay amount in installments
            </Text>

            <Button
              type="link"
              onClick={() => setShowInstallments(!showInstallments)}
              style={{ marginTop: "10px" }}
              icon={showInstallments ? <UpOutlined /> : <DownOutlined />}
            >
              {showInstallments
                ? "Hide Installment Plans"
                : "Show Installment Plans"}
            </Button>

            {showInstallments && (
              <div style={{ marginTop: "10px" }}>
                {filteredInstallments.length === 0 ? (
                  <Text>No installment plans available for this duration.</Text>
                ) : (
                  filteredInstallments.map((installmentPlan) => (
                    <Card
                      key={installmentPlan._id}
                      title={`${installmentPlan.planType} Plan`}
                      size="small"
                      style={{ marginTop: "10px" }}
                    >
                      <Timeline>
                        {installmentPlan.installments.map(
                          (installment, index) => (
                            <Timeline.Item key={index} color="blue">
                              <div>
                                <strong>Installment {index + 1}:</strong> ₹
                                {Math.floor(installment.amount)}
                              </div>
                              <div>Due Date: {installment.dueDate}</div>
                            </Timeline.Item>
                          )
                        )}
                      </Timeline>
                    </Card>
                  ))
                )}
              </div>
            )}

            <Button
              type="primary"
              block
              style={{ marginTop: "20px", borderRadius: "8px" }}
            >
              Proceed
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default BuyNowPage1;
