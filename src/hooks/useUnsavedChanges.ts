import { useEffect, useRef } from 'react';

interface UseUnsavedChangesOptions {
  hasUnsavedChanges: boolean;
  onBeforeUnload?: () => void;
}

export const useUnsavedChanges = ({ hasUnsavedChanges, onBeforeUnload }: UseUnsavedChangesOptions) => {
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault();
        e.returnValue = '';
        
        if (onBeforeUnload) {
          onBeforeUnload();
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [onBeforeUnload]);

  return hasUnsavedChanges;
};

