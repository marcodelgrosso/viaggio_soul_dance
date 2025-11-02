import React, { createContext, useContext, ReactNode } from 'react';
import { useToast } from '../hooks/useToast';
import { ToastMessage } from '../components/ToastContainer';

interface ToastContextType {
  showToast: (message: string, type?: ToastMessage['type'], duration?: number) => string;
  showSuccess: (message: string, duration?: number) => string;
  showError: (message: string, duration?: number) => string;
  showWarning: (message: string, duration?: number) => string;
  showInfo: (message: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const toast = useToast();

  return (
    <ToastContext.Provider
      value={{
        showToast: toast.showToast,
        showSuccess: toast.showSuccess,
        showError: toast.showError,
        showWarning: toast.showWarning,
        showInfo: toast.showInfo,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
};

