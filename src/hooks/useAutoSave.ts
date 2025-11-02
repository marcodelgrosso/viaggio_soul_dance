import { useEffect, useRef } from 'react';
import { useDebounce } from './useDebounce';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  debounceDelay?: number;
  enabled?: boolean;
  onSaveStart?: () => void;
  onSaveComplete?: () => void;
  onSaveError?: (error: Error) => void;
}

export const useAutoSave = <T>({
  data,
  onSave,
  debounceDelay = 2000,
  enabled = true,
  onSaveStart,
  onSaveComplete,
  onSaveError,
}: UseAutoSaveOptions<T>) => {
  const debouncedData = useDebounce(data, debounceDelay);
  const isInitialMount = useRef(true);
  const previousDataRef = useRef<T>(data);

  useEffect(() => {
    // Non salvare al primo mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousDataRef.current = data;
      return;
    }

    // Non salvare se disabilitato
    if (!enabled) {
      return;
    }

    // Salva solo se i dati sono effettivamente cambiati
    const dataChanged = JSON.stringify(debouncedData) !== JSON.stringify(previousDataRef.current);
    
    if (dataChanged && debouncedData) {
      const saveData = async () => {
        try {
          onSaveStart?.();
          await onSave(debouncedData);
          previousDataRef.current = debouncedData;
          onSaveComplete?.();
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Errore nel salvataggio automatico');
          onSaveError?.(err);
        }
      };

      saveData();
    }
  }, [debouncedData, enabled, onSave, onSaveStart, onSaveComplete, onSaveError]);

  return {
    isSaving: false, // Può essere esteso per tracciare lo stato
  };
};

