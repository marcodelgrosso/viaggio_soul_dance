import React from 'react';
import '../styles/components/Hero.scss';

const Hero: React.FC = () => {
  const scrollToDestinations = () => {
    const destinations = document.getElementById('destinations');
    destinations?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="hero">
      <div className="hero-content">
        <h1>Viaggio Soul Dance</h1>
        <p className="travel-dates">6 Dicembre - 8 Dicembre 2024</p>
        <p>Scopri le tue mete europee da sogno in un weekend indimenticabile</p>
        <button className="cta-button" onClick={scrollToDestinations}>
          <i className="fas fa-compass"></i>
          Esplora le destinazioni
        </button>
      </div>
      <div className="hero-image">
        <div className="floating-elements">
          <div className="floating-element element-1">
            <i className="fas fa-plane"></i>
          </div>
          <div className="floating-element element-2">
            <i className="fas fa-compass"></i>
          </div>
          <div className="floating-element element-3">
            <i className="fas fa-suitcase-rolling"></i>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;


