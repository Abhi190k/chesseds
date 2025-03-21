import { useState, useCallback } from 'react';

export const usePositionRecognition = () => {
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  const recognizePosition = useCallback(async (file: File): Promise<string | null> => {
    try {
      setIsRecognizing(true);
      setRecognitionError(null);

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/recognize-position', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to recognize position');
      }

      const data = await response.json();
      return data.fen;
    } catch (error) {
      console.error('Position recognition error:', error);
      setRecognitionError(error instanceof Error ? error.message : 'Unknown error');
      return null;
    } finally {
      setIsRecognizing(false);
    }
  }, []);

  return {
    recognizePosition,
    isRecognizing,
    recognitionError
  };
};