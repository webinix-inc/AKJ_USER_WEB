import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const LoadingSpinner = ({ 
  size = 'large', 
  tip = 'Loading...', 
  className = '',
  style = {},
  fullScreen = false 
}) => {
  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
  
  const containerStyle = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1000,
    ...style
  } : {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    ...style
  };

  return (
    <div className={className} style={containerStyle}>
      <Spin 
        indicator={antIcon} 
        size={size} 
        tip={tip}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}
      />
    </div>
  );
};

export default LoadingSpinner;