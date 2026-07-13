import React, { createContext, useState, useContext } from 'react';
import { api } from '../services/api';

interface Document {
  id: number;
  name: string;
  file_size: number;
  created_at: string;
  summary: string | null;
  owner_id: number;
}

interface ChatMessage {
  id: number;
  sender: 'user' | 'assistant';
  content: string;
  citations: Array<{ page: number; text: string; document_id: number }> | null;
  created_at: string;
}

interface ChatSession {
  id: number;
  title: string;
  created_at: string;
}

interface ChatContextType {
  documents: Document[];
  selectedDocumentIds: number[];
  sessions: ChatSession[];
  activeSession: ChatSession | null;
  messages: ChatMessage[];
  loadingDocs: boolean;
  loadingHistory: boolean;
  loadingChat: boolean;
  activeSummary: { id: number; summary: string } | null;
  loadingSummary: boolean;
  setActiveSummary: React.Dispatch<React.SetStateAction<{ id: number; summary: string } | null>>;
  
  toggleSelectDocument: (id: number) => void;
  loadDocuments: () => Promise<void>;
  uploadDocument: (file: File) => Promise<void>;
  deleteDocument: (id: number) => Promise<void>;
  summarizeDocument: (id: number) => Promise<string>;
  loadHistory: () => Promise<void>;
  loadSession: (id: number) => Promise<void>;
  deleteSession: (id: number) => Promise<void>;
  askQuestion: (question: string) => Promise<void>;
  startNewChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [activeSummary, setActiveSummary] = useState<{ id: number; summary: string } | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const toggleSelectDocument = (id: number) => {
    setSelectedDocumentIds(prev =>
      prev.includes(id) ? prev.filter(docId => docId !== id) : [...prev, id]
    );
  };

  const loadDocuments = async () => {
    setLoadingDocs(true);
    try {
      const data = await api.listDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const uploadDocument = async (file: File) => {
    setLoadingDocs(true);
    try {
      const newDoc = await api.uploadDocument(file);
      setDocuments(prev => [newDoc, ...prev]);
      // Auto select the newly uploaded document
      setSelectedDocumentIds(prev => [...prev, newDoc.id]);
    } catch (err) {
      console.error('Upload failed', err);
      throw err;
    } finally {
      setLoadingDocs(false);
    }
  };

  const deleteDocument = async (id: number) => {
    try {
      await api.deleteDocument(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      setSelectedDocumentIds(prev => prev.filter(docId => docId !== id));
      if (activeSummary?.id === id) {
        setActiveSummary(null);
      }
    } catch (err) {
      console.error('Failed to delete document', err);
      throw err;
    }
  };

  const summarizeDocument = async (id: number): Promise<string> => {
    setLoadingSummary(true);
    setActiveSummary(null);
    try {
      const res = await api.summarizeDocument(id);
      setActiveSummary(res);
      // Update local documents cache with summary
      setDocuments(prev =>
        prev.map(d => (d.id === id ? { ...d, summary: res.summary } : d))
      );
      return res.summary;
    } catch (err) {
      console.error('Failed to generate summary', err);
      throw err;
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await api.getChatHistory();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadSession = async (id: number) => {
    setLoadingChat(true);
    try {
      const data = await api.getChatSession(id);
      setActiveSession({ id: data.id, title: data.title, created_at: data.created_at });
      setMessages(data.messages);
    } catch (err) {
      console.error('Failed to load session details', err);
    } finally {
      setLoadingChat(false);
    }
  };

  const deleteSession = async (id: number) => {
    try {
      await api.deleteChatSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (activeSession?.id === id) {
        startNewChat();
      }
    } catch (err) {
      console.error('Failed to delete chat session', err);
      throw err;
    }
  };

  const askQuestion = async (question: string) => {
    if (selectedDocumentIds.length === 0) {
      throw new Error('Please select at least one document to chat.');
    }
    
    // Add user message to UI immediately for latency-masking UI feedback
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      sender: 'user',
      content: question,
      citations: null,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setLoadingChat(true);

    try {
      const res = await api.askQuestion(question, selectedDocumentIds, activeSession?.id);
      
      const newAssistantMsg: ChatMessage = {
        id: res.message_id,
        sender: 'assistant',
        content: res.answer,
        citations: res.citations,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => {
        // Filter out temp message and append actual messages
        const withoutTemp = prev.filter(m => m.id !== tempUserMsg.id);
        return [...withoutTemp, tempUserMsg, newAssistantMsg];
      });

      // If a new session was created
      if (!activeSession) {
        const newSession: ChatSession = {
          id: res.chat_id,
          title: question.slice(0, 30) + (question.length > 30 ? '...' : ''),
          created_at: new Date().toISOString()
        };
        setActiveSession(newSession);
        setSessions(prev => [newSession, ...prev]);
      }
    } catch (err) {
      // Remove temp message and rethrow
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
      throw err;
    } finally {
      setLoadingChat(false);
    }
  };

  const startNewChat = () => {
    setActiveSession(null);
    setMessages([]);
  };

  return (
    <ChatContext.Provider
      value={{
        documents,
        selectedDocumentIds,
        sessions,
        activeSession,
        messages,
        loadingDocs,
        loadingHistory,
        loadingChat,
        activeSummary,
        loadingSummary,
        setActiveSummary,
        toggleSelectDocument,
        loadDocuments,
        uploadDocument,
        deleteDocument,
        summarizeDocument,
        loadHistory,
        loadSession,
        deleteSession,
        askQuestion,
        startNewChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
