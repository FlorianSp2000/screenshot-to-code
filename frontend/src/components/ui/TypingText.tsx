import { useEffect, useId, useMemo } from 'react';
import { useTypingQueue } from '../../context/TypingQueueContext';

interface TypingTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  showCursor?: boolean;
  onComplete?: () => void;
  instant?: boolean; // Skip typing effect and show instantly
  stableId?: string; // Optional stable ID to prevent duplicates
}

export function TypingText({ 
  text, 
  speed = 50, 
  delay = 0, 
  className = '',
  showCursor = true,
  onComplete,
  instant = false,
  stableId
}: TypingTextProps) {
  const reactId = useId();
  const { addToQueue, isTyping, getDisplayText } = useTypingQueue();
  
  // Use stable ID if provided, otherwise create one based on text content
  const id = useMemo(() => {
    return stableId || `typing-${text.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}-${reactId}`;
  }, [stableId, text, reactId]);

  useEffect(() => {
    if (instant) {
      return; // Don't add to queue if instant
    }

    // Only add to queue once per unique id/text combination
    const existingText = getDisplayText(id);
    
    // If this text is already fully displayed, don't re-queue
    if (existingText === text) {
      return;
    }

    addToQueue({
      id,
      text,
      speed,
      delay,
      onComplete
    });

    // Cleanup function
    return () => {
      // Note: We don't remove from queue on unmount as that could interrupt ongoing typing
    };
  }, [id, text, getDisplayText, addToQueue]); // Only essential dependencies

  if (instant) {
    return <span className={`typing-text ${className}`}>{text}</span>;
  }

  const displayedText = getDisplayText(id);
  const currentlyTyping = isTyping(id);

  return (
    <span className={`typing-text ${className}`}>
      {displayedText}
      {(currentlyTyping && showCursor) && <span className="typing-cursor" />}
    </span>
  );
}