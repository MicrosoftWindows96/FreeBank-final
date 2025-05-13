import React, { useEffect, useState } from 'react';
import '../../styles/SecureLogo.css';

const SecureLogo: React.FC = () => {
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    setAnimate(true);
    
    const interval = setInterval(() => {
      setAnimate(false);
      setTimeout(() => setAnimate(true), 300);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="secure-logo-container">
      <div className={`secure-logo ${animate ? 'animate' : ''}`}>
        <div className="shield">
          <div className="shield-top"></div>
          <div className="shield-body"></div>
        </div>
        <div className="lock">
          <div className="lock-body"></div>
          <div className="lock-hook"></div>
        </div>
      </div>
    </div>
  );
};

export default SecureLogo; 