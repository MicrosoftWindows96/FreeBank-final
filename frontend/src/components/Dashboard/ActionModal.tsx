import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/Modal.css';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

const ActionModal: React.FC<ActionModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  className = ''
}) => {
  const { t } = useTranslation();
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content clean-modal ${className}`} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="modal-header">
            <h2>{title}</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        )}
        <div className={`modal-body ${!title ? 'no-header' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ActionModal; 