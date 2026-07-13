import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { MessageSquare, Plus, LogOut, User, Trash2, Library } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { 
    sessions, 
    activeSession, 
    loadHistory, 
    loadSession, 
    deleteSession, 
    startNewChat,
    loadingHistory 
  } = useChat();

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className="w-80 h-full bg-white/45 backdrop-blur-xl border-r border-slate-200/65 flex flex-col justify-between overflow-hidden relative z-10">
      {/* Top Section */}
      <div className="flex flex-col flex-1 min-h-0">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200/65 flex items-center space-x-3 bg-white/20">
          <div className="w-12 h-12 bg-gradient-to-tr from-primary to-primary-light rounded-2xl flex items-center justify-center border border-primary/20 shadow-md shadow-primary/15">
            <Library className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-slate-900">AI PDF Chat</h1>
            <span className="text-[11px] uppercase font-extrabold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full mt-0.5 inline-block tracking-wider">
              RAG Pipeline
            </span>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={startNewChat}
            className="w-full bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 border border-primary/20 transition-all duration-300 shadow-md shadow-primary/20 active:scale-98 text-base"
          >
            <Plus className="w-5 h-5" />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1.5 py-2">
          <div className="px-3 py-2 text-sm font-bold text-slate-500 uppercase tracking-wider">
            Conversations
          </div>

          {loadingHistory ? (
            <div className="flex flex-col space-y-2 p-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-white/50 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-10 text-base text-slate-400">
              No conversations yet
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = activeSession?.id === session.id;
              return (
                <div
                  key={session.id}
                  onClick={() => loadSession(session.id)}
                  className={`group flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all duration-200 border ${
                    isActive 
                      ? 'bg-gradient-to-r from-primary to-primary-light border-primary-dark/30 text-white shadow-lg shadow-primary/15 font-semibold' 
                      : 'hover:bg-primary/5 text-slate-600 hover:text-primary border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <MessageSquare className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="text-base truncate">{session.title}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this chat history?')) {
                        deleteSession(session.id);
                      }
                    }}
                    className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity duration-200 ${
                      isActive ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-red-500'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-slate-200 bg-white/30 backdrop-blur-md">
        <div className="flex items-center justify-between p-3.5 bg-white/80 border border-slate-200/65 rounded-xl shadow-sm">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-slate-900 truncate">{user?.username}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="hover:bg-slate-100 text-slate-500 hover:text-red-500 p-2 rounded-lg transition-colors duration-200 border border-transparent hover:border-slate-200"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
