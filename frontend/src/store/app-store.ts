import { create } from "zustand";
import { AppState } from "../types";
import { UIExtractionResult } from "../services/extractionService";

export interface StatusUpdate {
  id: string;
  message: string;
  timestamp: Date;
  isComplete: boolean;
  type: 'analyzing' | 'generating' | 'processing' | 'complete' | 'error' | 'thinking' | 'reasoning' | 'extracting';
  commitId?: string; // Link status to specific commit/generation
  phase?: string; // For phase-specific updates
}

export interface ThinkingStep {
  id: string;
  content: string;
  timestamp: Date;
  commitId: string;
  type: 'thinking' | 'reasoning';
}

// Store for app-wide state
interface AppStore {
  appState: AppState;
  setAppState: (state: AppState) => void;

  // Status tracking
  currentStatus: StatusUpdate | null;
  statusHistory: StatusUpdate[];
  thinkingSteps: ThinkingStep[];
  setCurrentStatus: (status: StatusUpdate | null) => void;
  addToStatusHistory: (status: StatusUpdate) => void;
  addThinkingStep: (step: ThinkingStep) => void;
  clearStatusHistory: () => void;

  // UI extraction results
  extractionResults: Map<string, UIExtractionResult>; // commitId -> extraction result
  streamingExtraction: string | null; // Current streaming JSON for preview
  selectedJsonForViewing: string | null; // JSON selected for viewing in preview pane
  setExtractionResult: (commitId: string, result: UIExtractionResult) => void;
  getExtractionResult: (commitId: string) => UIExtractionResult | undefined;
  setStreamingExtraction: (json: string | null) => void;
  setSelectedJsonForViewing: (json: string | null) => void;
  clearExtractionResults: () => void;

  // UI state
  updateInstruction: string;
  setUpdateInstruction: (instruction: string) => void;

  // Update images support (multiple images)
  updateImages: string[];
  setUpdateImages: (images: string[]) => void;

  inSelectAndEditMode: boolean;
  toggleInSelectAndEditMode: () => void;
  disableInSelectAndEditMode: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  appState: AppState.INITIAL,
  setAppState: (state: AppState) => set({ appState: state }),

  // Status tracking
  currentStatus: null,
  statusHistory: [],
  thinkingSteps: [],
  setCurrentStatus: (status: StatusUpdate | null) => set({ currentStatus: status }),
  addToStatusHistory: (status: StatusUpdate) =>
    set((state) => {
      // Skip temporary/streaming messages from history but allow important extraction milestones
      if (status.message.includes('chars)') || 
          status.message.includes('Analyzing UI components') ||
          status.message.includes('Initializing')) {
        return state; // Don't save temporary messages
      }
      
      // Skip interim extraction steps but allow important milestones
      if (status.type === 'extracting' && status.message.includes('...') && 
          !status.message.includes('Starting UI analysis...') && 
          !status.message.includes('UI structure extracted successfully')) {
        return state; // Don't save interim extraction steps like "Identifying..."
      }
      
      // Allow these extraction messages to be saved:
      const allowedExtractionMessages = [
        'Starting UI analysis...',
        'Processing image...',
        'Extracting structured image information',
        'UI structure extracted successfully'
      ];
      const isAllowedExtraction = status.type === 'extracting' && 
        allowedExtractionMessages.some(msg => status.message.includes(msg));
      
      // Save important extraction milestones and non-extraction messages
      if (status.type !== 'extracting' || isAllowedExtraction) {
        // Prevent duplicate status messages in a row
        const lastStatus = state.statusHistory[state.statusHistory.length - 1];
        if (lastStatus && 
            lastStatus.commitId === status.commitId && 
            lastStatus.message === status.message) {
          return state; // Don't add consecutive duplicates
        }
        
        return { statusHistory: [...state.statusHistory, status] };
      }
      
      return state; // Don't save other extraction messages
    }),
  addThinkingStep: (step: ThinkingStep) =>
    set((state) => ({ thinkingSteps: [...state.thinkingSteps, step] })),
  clearStatusHistory: () => set({ statusHistory: [], currentStatus: null, thinkingSteps: [], extractionResults: new Map() }),

  // UI extraction results
  extractionResults: new Map<string, UIExtractionResult>(),
  streamingExtraction: null,
  selectedJsonForViewing: null,
  setExtractionResult: (commitId: string, result: UIExtractionResult) =>
    set((state) => {
      const newResults = new Map(state.extractionResults);
      newResults.set(commitId, result);
      return { extractionResults: newResults, streamingExtraction: null }; // Clear streaming when complete
    }),
  getExtractionResult: (commitId: string): UIExtractionResult | undefined => {
    return get().extractionResults.get(commitId);
  },
  setStreamingExtraction: (json: string | null) => set({ streamingExtraction: json }),
  setSelectedJsonForViewing: (json: string | null) => set({ selectedJsonForViewing: json }),
  clearExtractionResults: () => set({ extractionResults: new Map(), streamingExtraction: null, selectedJsonForViewing: null }),

  // UI state
  updateInstruction: "",
  setUpdateInstruction: (instruction: string) =>
    set({ updateInstruction: instruction }),

  // Update images support
  updateImages: [],
  setUpdateImages: (images: string[]) => set({ updateImages: images }),

  inSelectAndEditMode: false,
  toggleInSelectAndEditMode: () =>
    set((state) => ({ inSelectAndEditMode: !state.inSelectAndEditMode })),
  disableInSelectAndEditMode: () => set({ inSelectAndEditMode: false }),
}));
