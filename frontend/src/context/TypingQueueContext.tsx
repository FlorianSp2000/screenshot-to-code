import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface QueueItem {
  id: string;
  text: string;
  speed: number;
  delay: number;
  onComplete?: () => void;
}

interface TypingQueueContextType {
  addToQueue: (item: QueueItem) => void;
  getCurrentTyping: () => QueueItem | null;
  isTyping: (id: string) => boolean;
  getDisplayText: (id: string) => string;
  removeFromQueue: (id: string) => void;
  updateQueueItem: (id: string, newText: string) => void;
}

const TypingQueueContext = createContext<TypingQueueContextType | null>(null);

export function useTypingQueue() {
  const context = useContext(TypingQueueContext);
  if (!context) {
    throw new Error('useTypingQueue must be used within a TypingQueueProvider');
  }
  return context;
}

export function TypingQueueProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentlyTyping, setCurrentlyTyping] = useState<QueueItem | null>(null);
  const [displayTexts, setDisplayTexts] = useState<Map<string, string>>(new Map());
  
  const typingTimer = useRef<NodeJS.Timeout | null>(null);
  const currentIndex = useRef<number>(0);

  // Process the queue
  useEffect(() => {
    if (!currentlyTyping && queue.length > 0) {
      const nextItem = queue[0];
      setCurrentlyTyping(nextItem);
      setQueue(prev => prev.slice(1));
      currentIndex.current = 0;
      
      console.log("🎬 Starting to type:", nextItem.text);
      
      // Start typing after delay
      setTimeout(() => {
        startTyping(nextItem);
      }, nextItem.delay);
    }
  }, [currentlyTyping, queue]);

  const startTyping = (item: QueueItem) => {
    const typeNextChar = () => {
      if (currentIndex.current < item.text.length) {
        const newText = item.text.slice(0, currentIndex.current + 1);
        setDisplayTexts(prev => new Map(prev.set(item.id, newText)));
        currentIndex.current++;
        
        const intervalTime = 1000 / item.speed;
        typingTimer.current = setTimeout(typeNextChar, intervalTime);
      } else {
        // Typing complete
        console.log("✅ Finished typing:", item.text);
        setCurrentlyTyping(null);
        item.onComplete?.();
      }
    };
    
    typeNextChar();
  };

  const addToQueue = useCallback((item: QueueItem) => {
    // Avoid duplicate entries by checking both ID and text content
    setQueue(prev => {
      const existsById = prev.some(queueItem => queueItem.id === item.id);
      const existsByText = prev.some(queueItem => queueItem.text === item.text);
      
      if (existsById) {
        console.log("⚠️ Item already in queue by ID:", item.id);
        return prev;
      }
      
      if (existsByText) {
        console.log("⚠️ Item already in queue by text:", item.text);
        return prev;
      }
      
      // Also check if this text is currently being typed
      if (currentlyTyping && currentlyTyping.text === item.text) {
        console.log("⚠️ Item currently being typed:", item.text);
        return prev;
      }
      
      console.log("📝 Added to typing queue:", item.text);
      return [...prev, item];
    });
    
    // Initialize display text only if not already exists
    setDisplayTexts(prev => {
      if (prev.has(item.id)) {
        return prev;
      }
      return new Map(prev.set(item.id, ''));
    });
  }, [currentlyTyping]);

  const getCurrentTyping = useCallback(() => currentlyTyping, [currentlyTyping]);

  const isTyping = useCallback((id: string) => {
    return currentlyTyping?.id === id;
  }, [currentlyTyping]);

  const getDisplayText = useCallback((id: string) => {
    return displayTexts.get(id) || '';
  }, [displayTexts]);

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
    setDisplayTexts(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const updateQueueItem = useCallback((id: string, newText: string) => {
    // Update queue item text
    setQueue(prev => prev.map(item => 
      item.id === id ? { ...item, text: newText } : item
    ));
    
    // Update currently typing if it matches
    setCurrentlyTyping(prev => 
      prev && prev.id === id ? { ...prev, text: newText } : prev
    );
    
    console.log("🔄 Updated queue item:", id, "to:", newText);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
      }
    };
  }, []);

  return (
    <TypingQueueContext.Provider value={{
      addToQueue,
      getCurrentTyping,
      isTyping,
      getDisplayText,
      removeFromQueue,
      updateQueueItem
    }}>
      {children}
    </TypingQueueContext.Provider>
  );
}