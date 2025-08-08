import { useState, useEffect } from 'react';

interface UseTypingEffectProps {
  text: string;
  speed?: number; // Characters per second
  delay?: number; // Initial delay before typing starts
  onComplete?: () => void;
}

export function useTypingEffect({ 
  text, 
  speed = 50, // Default: 50 characters per second (fast for UI messages)
  delay = 0,
  onComplete 
}: UseTypingEffectProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Reset state when text changes
    setDisplayedText('');
    setCurrentIndex(0);
    setIsTyping(false);
    setIsComplete(false);

    if (!text) return;

    const startTyping = () => {
      setIsTyping(true);
    };

    const delayTimer = setTimeout(startTyping, delay);
    return () => clearTimeout(delayTimer);
  }, [text, delay]);

  useEffect(() => {
    if (!isTyping || currentIndex >= text.length) {
      if (currentIndex >= text.length && !isComplete) {
        setIsComplete(true);
        setIsTyping(false);
        onComplete?.();
      }
      return;
    }

    const intervalTime = 1000 / speed; // Convert speed to interval
    const timer = setTimeout(() => {
      setDisplayedText(text.slice(0, currentIndex + 1));
      setCurrentIndex(prev => prev + 1);
    }, intervalTime);

    return () => clearTimeout(timer);
  }, [currentIndex, isTyping, text, speed, isComplete, onComplete]);

  return {
    displayedText,
    isTyping,
    isComplete
  };
}