import React from 'react';
import '../styles/components/SkeletonScreen.scss';

interface SkeletonScreenProps {
  type?: 'card' | 'list' | 'form' | 'table';
  count?: number;
  className?: string;
}

const SkeletonScreen: React.FC<SkeletonScreenProps> = ({
  type = 'card',
  count = 1,
  className = '',
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="skeleton-card">
            <div className="skeleton-image"></div>
            <div className="skeleton-content">
              <div className="skeleton-title"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-text short"></div>
              <div className="skeleton-tags">
                <div className="skeleton-tag"></div>
                <div className="skeleton-tag"></div>
                <div className="skeleton-tag"></div>
              </div>
            </div>
          </div>
        );
      case 'list':
        return (
          <div className="skeleton-list-item">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-list-content">
              <div className="skeleton-title"></div>
              <div className="skeleton-text short"></div>
            </div>
          </div>
        );
      case 'form':
        return (
          <div className="skeleton-form">
            <div className="skeleton-field">
              <div className="skeleton-label"></div>
              <div className="skeleton-input"></div>
            </div>
            <div className="skeleton-field">
              <div className="skeleton-label"></div>
              <div className="skeleton-textarea"></div>
            </div>
            <div className="skeleton-field">
              <div className="skeleton-label"></div>
              <div className="skeleton-input"></div>
            </div>
          </div>
        );
      case 'table':
        return (
          <div className="skeleton-table">
            <div className="skeleton-table-row">
              <div className="skeleton-table-cell"></div>
              <div className="skeleton-table-cell"></div>
              <div className="skeleton-table-cell"></div>
            </div>
            <div className="skeleton-table-row">
              <div className="skeleton-table-cell"></div>
              <div className="skeleton-table-cell"></div>
              <div className="skeleton-table-cell"></div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`skeleton-container ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </div>
  );
};

export default SkeletonScreen;

