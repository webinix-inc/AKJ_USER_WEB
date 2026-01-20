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
    studentPhone = 'N/A',
    planType = 'Standard',
    coursePrice = 0,
    amountPaid = 0,
    remainingAmount = 0
  } = receiptData || {};

  const normalizeValue = (value) => {
    if (value === null || value === undefined) return "";
    const trimmed = String(value).trim();
    return trimmed && trimmed !== "N/A" ? trimmed : "";
  };

  const paymentMode =
    receiptData?.paymentMode || (totalInstallments > 1 ? 'installment' : 'full');
  const isInstallment = paymentMode === 'installment';
  const isBook = paymentMode === 'book';
  const courseSectionTitle = isBook ? 'Item Information' : 'Course Information';
  const planLabel = isBook ? 'Payment Type' : 'Plan Type';
  const planValue = isBook ? planType : `${planType} Plan`;
  const totalPriceLabel = isBook ? 'Total Price' : 'Total Course Price';
  const amountPaidLabel = isInstallment
    ? 'Amount Paid (This Installment)'
    : 'Amount Paid';
  const receiptNumber =
    normalizeValue(trackingNumber) ||
    normalizeValue(orderId) ||
    normalizeValue(transactionId) ||
    'N/A';

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
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      // Add image to PDF with pagination if needed
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfPageHeight;

      while (heightLeft > 0) {
        position -= pdfPageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfPageHeight;
      }

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
        padding: '20px',
        backgroundColor: '#ffffff',
        fontFamily: 'Times New Roman, Georgia, serif',
        color: '#111111',
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '18px',
        borderBottom: '1px solid #1f2a33',
        paddingBottom: '8px'
      }}>
        <h1 style={{ 
          color: '#1f2a33', 
          fontSize: '22px', 
          margin: '0 0 6px 0',
          fontWeight: 'bold'
        }}>
          AKJ Classes
        </h1>
        <p style={{ 
          color: '#444', 
          fontSize: '11px', 
          margin: '0',
          letterSpacing: '0.4px'
        }}>
          Payment Receipt
        </p>
      </div>

      {/* Receipt Details */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ 
          backgroundColor: '#f5f6f7', 
          padding: '10px 12px', 
          borderRadius: '4px',
          border: '1px solid #e3e6e8',
          marginBottom: '8px'
        }}>
          <h2 style={{ 
            color: '#1f2a33', 
            fontSize: '14px', 
            margin: '0 0 8px 0',
            borderBottom: '1px solid #d3d7da',
            paddingBottom: '5px'
          }}>
            Receipt Information
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <strong style={{ color: '#555', fontSize: '11px', display: 'block', marginBottom: '3px' }}>Receipt Number:</strong>
              <span style={{ fontSize: '12px', color: '#111' }}>
                {receiptNumber}
              </span>
            </div>
            <div>
              <strong style={{ color: '#555', fontSize: '11px', display: 'block', marginBottom: '3px' }}>Date:</strong>
              <span style={{ fontSize: '12px', color: '#111' }}>{formatDate(paymentDate)}</span>
            </div>
            <div>
              <strong style={{ color: '#555', fontSize: '11px', display: 'block', marginBottom: '3px' }}>Transaction ID:</strong>
              <span style={{ fontSize: '12px', color: '#111', wordBreak: 'break-all' }}>{transactionId}</span>
            </div>
            <div>
              <strong style={{ color: '#555', fontSize: '11px', display: 'block', marginBottom: '3px' }}>Order ID:</strong>
              <span style={{ fontSize: '12px', color: '#111', wordBreak: 'break-all' }}>{orderId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Student Information */}
      <div style={{ marginBottom: '14px' }}>
        <h3 style={{ 
          color: '#1f2a33', 
          fontSize: '14px', 
          margin: '0 0 6px 0',
          borderBottom: '1px solid #d3d7da',
          paddingBottom: '5px'
        }}>
          Student Information
        </h3>
        <div style={{ 
          backgroundColor: '#f5f6f7', 
          padding: '10px 12px', 
          borderRadius: '4px',
          border: '1px solid #e3e6e8'
        }}>
          <div style={{ marginBottom: '6px' }}>
            <strong style={{ color: '#555', fontSize: '11px', display: 'block', marginBottom: '3px' }}>Name:</strong>
            <span style={{ fontSize: '12px', color: '#111' }}>{studentName}</span>
          </div>
          <div>
            <strong style={{ color: '#555', fontSize: '11px', display: 'block', marginBottom: '3px' }}>Email:</strong>
            <span style={{ fontSize: '12px', color: '#111' }}>{studentEmail}</span>
          </div>
          <div style={{ marginTop: '6px' }}>
            <strong style={{ color: '#555', fontSize: '11px', display: 'block', marginBottom: '3px' }}>Phone:</strong>
            <span style={{ fontSize: '12px', color: '#111' }}>{studentPhone}</span>
          </div>
        </div>
      </div>

      {/* Course Information */}
      <div style={{ marginBottom: '14px' }}>
        <h3 style={{ 
          color: '#1f2a33', 
          fontSize: '14px', 
          margin: '0 0 6px 0',
          borderBottom: '1px solid #d3d7da',
          paddingBottom: '5px'
        }}>
          {courseSectionTitle}
        </h3>
        <div style={{ 
          backgroundColor: '#f5f6f7', 
          padding: '10px 12px', 
          borderRadius: '4px',
          border: '1px solid #e3e6e8'
        }}>
          <div style={{ marginBottom: '6px' }}>
            <strong style={{ color: '#555', fontSize: '11px', display: 'block', marginBottom: '3px' }}>
              {isBook ? 'Item Name:' : 'Course Name:'}
            </strong>
            <span style={{ fontSize: '12px', color: '#111', fontWeight: 'bold' }}>{courseTitle}</span>
          </div>
          <div>
            <strong style={{ color: '#555', fontSize: '11px', display: 'block', marginBottom: '3px' }}>
              {planLabel}:
            </strong>
            <span style={{ fontSize: '12px', color: '#111' }}>{planValue}</span>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div style={{ marginBottom: '14px' }}>
        <h3 style={{ 
          color: '#1f2a33', 
          fontSize: '14px', 
          margin: '0 0 6px 0',
          borderBottom: '1px solid #d3d7da',
          paddingBottom: '5px'
        }}>
          Payment Details
        </h3>
        <div style={{ 
          backgroundColor: '#f5f6f7', 
          padding: '10px 12px', 
          borderRadius: '4px',
          border: '1px solid #e3e6e8'
        }}>
          {isInstallment && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '8px',
              paddingBottom: '8px',
              borderBottom: '1px solid #dee2e6'
            }}>
              <span style={{ fontSize: '12px', color: '#555' }}>Installment Number:</span>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#111' }}>
                {installmentNumber} of {totalInstallments}
              </span>
            </div>
          )}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '8px',
            paddingBottom: '8px',
            borderBottom: '1px solid #dee2e6'
          }}>
            <span style={{ fontSize: '12px', color: '#555' }}>{totalPriceLabel}:</span>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#111' }}>
              {formatCurrency(coursePrice)}
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '8px',
            paddingBottom: '8px',
            borderBottom: '1px solid #dee2e6'
          }}>
            <span style={{ fontSize: '12px', color: '#555' }}>{amountPaidLabel}:</span>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#2b6b2b' }}>
              {formatCurrency(amount)}
            </span>
          </div>
          {amountPaid > 0 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '8px',
              paddingBottom: '8px',
              borderBottom: '1px solid #dee2e6'
            }}>
              <span style={{ fontSize: '12px', color: '#555' }}>Total Amount Paid:</span>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#111' }}>
                {formatCurrency(amountPaid)}
              </span>
            </div>
          )}
          {isInstallment && remainingAmount > 0 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '0'
            }}>
              <span style={{ fontSize: '12px', color: '#555' }}>Remaining Amount:</span>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#8b1e1e' }}>
                {formatCurrency(remainingAmount)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Payment Summary Box */}
      <div style={{ 
        border: '1px solid #1f2a33', 
        padding: '10px', 
        borderRadius: '4px',
        marginBottom: '14px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '11px', marginBottom: '4px', color: '#555' }}>
          Payment Status
        </div>
        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '2px', color: '#1f2a33' }}>
          PAID
        </div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px', color: '#1f2a33' }}>
          {formatCurrency(amount)}
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        marginTop: '12px', 
        paddingTop: '8px', 
        borderTop: '1px solid #d3d7da',
        textAlign: 'center',
        color: '#555',
        fontSize: '10px',
        lineHeight: '1.4'
      }}>
        <div style={{ margin: '2px 0' }}>
          This is a computer-generated receipt and does not require a signature.
        </div>
        <div style={{ margin: '2px 0' }}>
          For queries: support@akjclasses.com
        </div>
        <div style={{ margin: '4px 0 0 0' }}>
          Thank you for your payment.
        </div>
      </div>
    </div>
  );
};

export default PaymentReceipt;

