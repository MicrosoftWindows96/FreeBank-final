import React, { useEffect, useState } from 'react';
import '../../styles/ModernSecureLogo.css';

const ModernSecureLogo: React.FC = () => {
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    
    const initialTimer = setTimeout(() => {
      setAnimate(true);
    }, 300);
    
    
    const interval = setInterval(() => {
      setAnimate(false);
      setTimeout(() => setAnimate(true), 400);
    }, 8000);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);
  
  return (
    <div className="modern-logo-container">
      <div className={`modern-logo ${animate ? 'animate' : ''}`}>
        <div className="shield-container">
          <div className="shield-outer"></div>
          <div className="shield-inner"></div>
          <div className="security-ring"></div>
          <div className="lock-icon"></div>
          <div className="security-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernSecureLogo; 