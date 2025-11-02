import React, { useState, useRef, useEffect } from 'react';
import '../styles/components/LazyImage.scss';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div className={`lazy-image-container ${className}`} ref={imgRef}>
      {!isLoaded && (
        <div className="lazy-image-placeholder">
          {placeholder ? (
            <img src={placeholder} alt="" aria-hidden="true" />
          ) : (
            <div className="lazy-image-skeleton">
              <i className="fas fa-image"></i>
            </div>
          )}
        </div>
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`lazy-image ${isLoaded ? 'loaded' : ''} ${hasError ? 'error' : ''}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
      {hasError && !isLoaded && (
        <div className="lazy-image-error">
          <i className="fas fa-exclamation-triangle"></i>
          <span>Errore nel caricamento dell'immagine</span>
        </div>
      )}
    </div>
  );
};

export default LazyImage;

