import React, { useState } from "react";
import { Button, Modal, List, Spin, Alert, Typography, message } from "antd";
import { useCoupon } from "../../../Context/CouponContext";
import { useUser } from "../../../Context/UserContext";

const { Text } = Typography;

const ApplyCouponComponent = ({ orderAmount, courseId, onCouponApply }) => {
  console.log(orderAmount);
  console.log("here is the courseID", courseId);
  const {
    availableCoupons,
    fetchAvailableCoupons,
    applyCoupon,
    loading,
    error,
  } = useCoupon();
  const { userData } = useUser();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null); // Selected coupon state
  const [selectedDiscount, setSelectedDiscount] = useState(null); // Selected coupon state

  const userId = userData?.userId;

  console.log("available Coupons are these :", availableCoupons);
  console.log("fetchavialable Coupons are these :", fetchAvailableCoupons);
  console.log("applycoupons are these :", applyCoupon);

  // Handle modal visibility
  const showModal = () => setIsModalVisible(true);
  const hideModal = () => setIsModalVisible(false);

  // Fetch coupons if modal is opened
  const handleModalOpen = async () => {
    await fetchAvailableCoupons(courseId);
    showModal();
  };

  // Handle coupon application
  const handleApplyCoupon = async (couponCode) => {
    const response = await applyCoupon(
      couponCode,
      userId,
      courseId,
      orderAmount
    );

    console.log("Coupon applied successfully :", response);
    if (response.success) {
      message.success(
        `Coupon Applied: ${response?.discount} (${response?.discountType})`
      );
      setSelectedCoupon(couponCode);
      // setSelectedDiscount(response?.discount);
      setSelectedDiscount({
        discount: response.discount,
        discountType: response.discountType,
        ...(response.discountType === "Percentage"
          ? { discountPercentage: response.discountPercentage }
          : { discountAmount: response.discountAmount }),
      });

      // Notify parent about the applied coupon
      if (onCouponApply) {
        onCouponApply(
          couponCode,
          response?.discount,
          response?.discountType,
          response?.discountType === "Percentage"
            ? response?.discountPercentage
            : response?.discountAmount
        );
      }
    } else {
      message.error(response.error || "Failed to apply coupon.");
    }
    hideModal();
  };

  const isExpired = (endDate) => {
    return new Date(endDate) < new Date();
  };

  return (
    <div className="apply-coupon-component mt-4 p-4 border rounded-md bg-gray-50">
      <div className="flex flex-col justify-between items-center">
        {/* <Text className="text-lg font-medium">
          {selectedDiscount && (selectedDiscount.discountType === "Percentage" ? {`Additional ${selectedDiscount.discountPercentage}% off`} : {`Additional Savings ₹${
          selectedDiscount.discountAmount
        }`})}
        </Text> */}
        <Text className="text-lg font-medium">
          {selectedDiscount &&
            (selectedDiscount.discountType === "Percentage"
              ? `Additional ${selectedDiscount.discountPercentage}% off`
              : `Additional Savings ₹${selectedDiscount.discountAmount}`)}
        </Text>

        <div className="flex flex-col items-center gap-2">
          {selectedCoupon ? (
            <Text type="success" className="text-green-500">
              Applied: {selectedCoupon}
            </Text>
          ) : (
            <Text className="text-gray-600">No Coupon Applied</Text>
          )}
          <Button type="primary" onClick={handleModalOpen}>
            View Coupons
          </Button>
        </div>
      </div>

      {/* Modal for displaying available coupons */}
      <Modal
        title="Apply Coupon Code"
        open={isModalVisible}
        onCancel={hideModal}
        footer={null}
        centered
      >
        {loading ? (
          <Spin tip="Loading coupons..." />
        ) : error ? (
          <Alert type="error" message={error} />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={availableCoupons}
            renderItem={(coupon) => (
              <List.Item
                actions={[
                  <Button
                    type="primary"
                    disabled={
                      isExpired(coupon.endDate) ||
                      selectedCoupon === coupon.couponCode
                    }
                    onClick={() => handleApplyCoupon(coupon.couponCode)}
                  >
                    {selectedCoupon === coupon.couponCode
                      ? "Applied"
                      : isExpired(coupon.endDate)
                      ? "Expired"
                      : "Apply"}
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={coupon.offerName}
                  description={
                    <>
                      <Text strong>{coupon.couponCode}</Text> -{" "}
                      {coupon.discountType === "Flat"
                        ? `₹${coupon.discountAmount} off`
                        : `${coupon.discountPercentage}% off`}
                      <br />
                      <Text
                        type={
                          isExpired(coupon.endDate)
                            ? "danger"
                            : selectedCoupon === coupon.couponCode
                            ? "success"
                            : "warning"
                        }
                      >
                        {selectedCoupon === coupon.couponCode
                          ? "Currently Applied"
                          : isExpired(coupon.endDate)
                          ? "Expired"
                          : `${new Date(
                              coupon.endDate
                            ).toDateString()} (Expiring Soon)`}
                      </Text>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </div>
  );
};

export default ApplyCouponComponent;
