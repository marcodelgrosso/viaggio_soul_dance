import React from 'react';
import '../styles/components/Modal.scss';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modal" style={{ display: 'block' }} onClick={onClose}>
      <div className="modal-content logout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="logout-modal-content">
          <div className="logout-modal-icon">
            <i className="fas fa-sign-out-alt"></i>
          </div>
          <h3>Conferma logout</h3>
          <p>Sei sicuro di voler uscire?</p>
          <div className="logout-modal-buttons">
            <button className="logout-confirm-btn" onClick={onConfirm}>
              <i className="fas fa-check"></i>
              Sì, esci
            </button>
            <button className="logout-cancel-btn" onClick={onClose}>
              <i className="fas fa-times"></i>
              Annulla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;

