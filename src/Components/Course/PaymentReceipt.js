import React, { useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PaymentReceipt = ({ 
  receiptData, 
  onDownload 
}) => {
  const receiptRef = useRef(null);

  const {
    courseTitle = 'N/A',
    installmentNumber = 1,
    totalInstallments = 1,
    amount = 0,
    paymentDate = new Date(),
    transactionId = 'N/A',
    orderId = 'N/A',
    trackingNumber = 'N/A',
    studentName = 'N/A',
    studentEmail = 'N/A',
    planType = 'Standard',
    coursePrice = 0,
    amountPaid = 0,
    remainingAmount = 0
  } = receiptData || {};

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleDownload = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Generate filename
      const filename = `Payment_Receipt_${courseTitle.replace(/\s+/g, '_')}_Installment_${installmentNumber}_${new Date().getTime()}.pdf`;
      
      // Save PDF
      pdf.save(filename);
      
      if (onDownload) {
        onDownload();
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  };

  // Auto-download when component mounts if onDownload is provided
  useEffect(() => {
    if (onDownload && receiptData) {
      handleDownload();
    }
  }, []);

  return (
    <div 
      ref={receiptRef}
      className="payment-receipt"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '40px',
        backgroundColor: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        color: '#000000',
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '40px',
        borderBottom: '3px solid #023d50',
        paddingBottom: '20px'
      }}>
        <h1 style={{ 
          color: '#023d50', 
          fontSize: '32px', 
          margin: '0 0 10px 0',
          fontWeight: 'bold'
        }}>
          AKJ Classes
        </h1>
        <p style={{ 
          color: '#666', 
          fontSize: '14px', 
          margin: '5px 0',
          fontStyle: 'italic'
        }}>
          Payment Receipt
        </p>
      </div>

      {/* Receipt Details */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h2 style={{ 
            color: '#023d50', 
            fontSize: '20px', 
            margin: '0 0 15px 0',
            borderBottom: '2px solid #023d50',
            paddingBottom: '10px'
          }}>
            Receipt Information
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <strong style={{ color: '#666', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Receipt Number:</strong>
              <span style={{ fontSize: '14px', color: '#000' }}>{trackingNumber || 'N/A'}</span>
            </div>
            <div>
              <strong style={{ color: '#666', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Date:</strong>
              <span style={{ fontSize: '14px', color: '#000' }}>{formatDate(paymentDate)}</span>
            </div>
            <div>
              <strong style={{ color: '#666', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Transaction ID:</strong>
              <span style={{ fontSize: '14px', color: '#000', wordBreak: 'break-all' }}>{transactionId}</span>
            </div>
            <div>
              <strong style={{ color: '#666', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Order ID:</strong>
              <span style={{ fontSize: '14px', color: '#000', wordBreak: 'break-all' }}>{orderId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Student Information */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ 
          color: '#023d50', 
          fontSize: '18px', 
          margin: '0 0 15px 0',
          borderBottom: '2px solid #023d50',
          paddingBottom: '8px'
        }}>
          Student Information
        </h3>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#666', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Name:</strong>
            <span style={{ fontSize: '14px', color: '#000' }}>{studentName}</span>
          </div>
          <div>
            <strong style={{ color: '#666', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Email:</strong>
            <span style={{ fontSize: '14px', color: '#000' }}>{studentEmail}</span>
          </div>
        </div>
      </div>

      {/* Course Information */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ 
          color: '#023d50', 
          fontSize: '18px', 
          margin: '0 0 15px 0',
          borderBottom: '2px solid #023d50',
          paddingBottom: '8px'
        }}>
          Course Information
        </h3>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#666', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Course Name:</strong>
            <span style={{ fontSize: '14px', color: '#000', fontWeight: 'bold' }}>{courseTitle}</span>
          </div>
          <div>
            <strong style={{ color: '#666', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Plan Type:</strong>
            <span style={{ fontSize: '14px', color: '#000' }}>{planType} Plan</span>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ 
          color: '#023d50', 
          fontSize: '18px', 
          margin: '0 0 15px 0',
          borderBottom: '2px solid #023d50',
          paddingBottom: '8px'
        }}>
          Payment Details
        </h3>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid #dee2e6'
          }}>
            <span style={{ fontSize: '14px', color: '#666' }}>Installment Number:</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#000' }}>
              {installmentNumber} of {totalInstallments}
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid #dee2e6'
          }}>
            <span style={{ fontSize: '14px', color: '#666' }}>Total Course Price:</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#000' }}>
              {formatCurrency(coursePrice)}
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid #dee2e6'
          }}>
            <span style={{ fontSize: '14px', color: '#666' }}>Amount Paid (This Installment):</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#28a745' }}>
              {formatCurrency(amount)}
            </span>
          </div>
          {amountPaid > 0 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: '1px solid #dee2e6'
            }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Total Amount Paid:</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#000' }}>
                {formatCurrency(amountPaid)}
              </span>
            </div>
          )}
          {remainingAmount > 0 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Remaining Amount:</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#dc3545' }}>
                {formatCurrency(remainingAmount)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Payment Summary Box */}
      <div style={{ 
        backgroundColor: '#023d50', 
        color: '#ffffff', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '14px', marginBottom: '10px', opacity: 0.9 }}>
          Payment Status
        </div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
          PAID
        </div>
        <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '10px' }}>
          {formatCurrency(amount)}
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        marginTop: '40px', 
        paddingTop: '20px', 
        borderTop: '2px solid #dee2e6',
        textAlign: 'center',
        color: '#666',
        fontSize: '12px'
      }}>
        <p style={{ margin: '5px 0' }}>
          This is a computer-generated receipt and does not require a signature.
        </p>
        <p style={{ margin: '5px 0' }}>
          For any queries, please contact support at support@akjclasses.com
        </p>
        <p style={{ margin: '10px 0 0 0', fontStyle: 'italic' }}>
          Thank you for your payment!
        </p>
      </div>
    </div>
  );
};

export default PaymentReceipt;

