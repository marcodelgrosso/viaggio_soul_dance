import React from 'react';
import '../styles/components/Footer.scss';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Viaggio Soul Dance</h4>
            <p>Creiamo esperienze di viaggio che risvegliano l'anima</p>
          </div>
          <div className="footer-section">
            <h4>Contatti</h4>
            <p><i className="fas fa-envelope"></i> info@viaggiosouldance.com</p>
            <p><i className="fas fa-phone"></i> +39 123 456 7890</p>
          </div>
          <div className="footer-section">
            <h4>Seguici</h4>
            <div className="social-links">
              <a href="#"><i className="fab fa-facebook"></i></a>
              <a href="#"><i className="fab fa-instagram"></i></a>
              <a href="#"><i className="fab fa-twitter"></i></a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Viaggio Soul Dance. Tutti i diritti riservati.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


