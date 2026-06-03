import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ChartConfig } from '@/types/charts';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  chartConfig?: ChartConfig;
  isStreaming?: boolean;
  error?: string;
}

export interface AIInsight {
  id: string;
  type: 'summary' | 'anomaly' | 'trend' | 'recommendation' | 'cleaning';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  affectedColumns?: string[];
  affectedRows?: number[];
  generatedAt: Date;
}

interface AIState {
  messages: AIMessage[];
  insights: AIInsight[];
  dataStory: string | null;
  isThinking: boolean;
  isChatThinking: boolean;
  streamingMessageId: string | null;
  suggestedPrompts: string[];
  queryHistory: string[];

  // Actions
  addMessage: (message: Omit<AIMessage, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, updates: Partial<AIMessage>) => void;
  addInsight: (insight: Omit<AIInsight, 'id' | 'generatedAt'>) => void;
  clearInsights: () => void;
  setDataStory: (story: string | null) => void;
  setIsThinking: (isThinking: boolean) => void;
  setIsChatThinking: (isChatThinking: boolean) => void;
  setStreamingMessageId: (id: string | null) => void;
  setSuggestedPrompts: (prompts: string[]) => void;
  addQueryToHistory: (query: string) => void;
  clearHistory: () => void;
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useAIStore = create<AIState>()(
  immer((set) => ({
    messages: [],
    insights: [],
    dataStory: null,
    isThinking: false,
    isChatThinking: false,
    streamingMessageId: null,
    suggestedPrompts: [],
    queryHistory: [],

    addMessage: (message) => {
      const id = generateId();
      set((state) => {
        state.messages.push({
          ...message,
          id,
          timestamp: new Date()
        });
      });
      return id;
    },

    updateMessage: (id, updates) => set((state) => {
      const message = state.messages.find((m) => m.id === id);
      if (message) {
        Object.assign(message, updates);
      }
    }),

    addInsight: (insight) => set((state) => {
      state.insights.push({
        ...insight,
        id: generateId(),
        generatedAt: new Date()
      });
    }),

    clearInsights: () => set((state) => {
      state.insights = [];
    }),

    setDataStory: (story) => set((state) => {
      state.dataStory = story;
    }),

    setIsThinking: (isThinking) => set((state) => {
      state.isThinking = isThinking;
    }),
    setIsChatThinking: (isChatThinking) => set((state) => {
      state.isChatThinking = isChatThinking;
    }),

    setStreamingMessageId: (id) => set((state) => {
      state.streamingMessageId = id;
    }),

    setSuggestedPrompts: (prompts) => set((state) => {
      state.suggestedPrompts = prompts;
    }),

    addQueryToHistory: (query) => set((state) => {
      // Remove the query if it already exists to move it to the front
      const filteredHistory = state.queryHistory.filter((q) => q !== query);
      state.queryHistory = [query, ...filteredHistory].slice(0, 50);
    }),

    clearHistory: () => set((state) => {
      state.queryHistory = [];
    })
  }))
);
