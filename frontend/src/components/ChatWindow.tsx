import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { Send, Sparkles, BookOpen, AlertTriangle, CheckCircle } from 'lucide-react';

export const ChatWindow: React.FC = () => {
  const {
    messages,
    selectedDocumentIds,
    documents,
    askQuestion,
    loadingChat,
    activeSession
  } = useChat();

  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeDocs = documents.filter(d => selectedDocumentIds.includes(d.id));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingChat]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loadingChat) return;
    if (selectedDocumentIds.length === 0) {
      setError('Please select at least one document from the library to chat.');
      return;
    }

    setError(null);
    const question = input.trim();
    setInput('');

    try {
      await askQuestion(question);
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Make sure GEMINI_API_KEY is configured.');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/70 flex items-center justify-between bg-white/40 backdrop-blur-xl shadow-sm relative z-20">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-slate-900 truncate">
            {activeSession ? activeSession.title : 'New Grounded Conversation'}
          </h3>
          <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
            {selectedDocumentIds.length === 0 
              ? 'No documents selected' 
              : `Grounded on ${selectedDocumentIds.length} document(s): ${activeDocs.map(d => d.name).join(', ')}`
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedDocumentIds.length > 0 && (
            <div className="flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50/90 px-3 py-1.5 rounded-full border border-emerald-250 shadow-sm font-semibold">
              <CheckCircle className="w-4 h-4" />
              <span>Grounded Mode</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0 relative z-10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 animate-pulse-slow shadow-md shadow-primary/5">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">AI RAG Playground</h2>
              <p className="text-base text-slate-550 mt-2.5 leading-relaxed font-medium">
                Upload business reports, textbooks, research papers, or documentation. 
                Select them in the library, and ask natural language questions.
              </p>
            </div>
            
            {selectedDocumentIds.length === 0 && (
              <div className="p-4 bg-amber-50 border border-amber-250 rounded-2xl flex items-start space-x-3 text-amber-800 text-sm text-left shadow-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">No Documents Selected</span>
                  Please upload a PDF document and select it in the sidebar library to begin grounded retrieval.
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl p-4 border shadow-md leading-relaxed ${
                    isUser 
                      ? 'bg-gradient-to-r from-primary to-primary-light text-white border-primary-dark/30 text-base shadow-primary/10 font-medium' 
                      : 'bg-white/90 backdrop-blur-md border-slate-200/80 text-slate-800 text-base font-medium'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    
                    {/* Citations list */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2.5 flex items-center">
                          <BookOpen className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          <span>Retrieved Sources</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {msg.citations.map((cite, idx) => {
                            const sourceDoc = documents.find(d => d.id === cite.document_id);
                            const docName = sourceDoc ? sourceDoc.name : `Doc #${cite.document_id}`;
                            return (
                              <div 
                                key={idx} 
                                className="group relative bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg p-2 max-w-full text-xs cursor-help transition-all duration-200 text-slate-700"
                              >
                                <span className="font-bold text-primary">Page {cite.page}</span>
                                <span className="text-slate-550 ml-1 truncate max-w-[150px] inline-block align-bottom font-bold">
                                  ({docName})
                                </span>
                                
                                {/* Citation preview tooltip */}
                                <div className="absolute bottom-full left-0 mb-2 w-80 p-3.5 bg-slate-900 border border-slate-950 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-30 text-[11px] leading-relaxed text-slate-200 whitespace-normal pointer-events-none">
                                  <p className="font-bold text-accent-light mb-1.5">Snippet from {docName} (Page {cite.page}):</p>
                                  <p className="italic text-slate-350">"...{cite.text.slice(0, 160)}..."</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {loadingChat && (
              <div className="flex justify-start">
                <div className="max-w-[70%] bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 flex items-center space-x-3 shadow-md">
                  <div className="flex space-x-1.5">
                    <span className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Searching index and generating answer...</span>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="p-4 border-t border-slate-200/70 bg-white/40 backdrop-blur-xl relative z-20 shadow-md">
        {error && (
          <div className="mb-3 p-3.5 bg-red-50 border border-red-200 text-red-650 text-xs rounded-xl flex items-center justify-between shadow-sm">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-slate-450 hover:text-slate-650 ml-2">✕</button>
          </div>
        )}
        
        <form onSubmit={handleSend} className="flex items-center space-x-3">
          <input
            type="text"
            required
            value={input}
            disabled={loadingChat || selectedDocumentIds.length === 0}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-white/80 border border-slate-200 rounded-xl py-4 px-4 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            placeholder={
              selectedDocumentIds.length === 0 
                ? "Select a document in the library to start chatting..." 
                : "Ask a question about the document context..."
            }
          />
          <button
            type="submit"
            disabled={!input.trim() || loadingChat || selectedDocumentIds.length === 0}
            className="p-4 bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-white rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/30 transition-all duration-300 border border-primary/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
