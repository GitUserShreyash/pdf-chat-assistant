import React from 'react';
import { Sidebar } from './Sidebar';
import { DocumentManager } from './DocumentManager';
import { ChatWindow } from './ChatWindow';

export const Layout: React.FC = () => {
  return (
    <div className="w-screen h-screen flex overflow-hidden bg-transparent text-slate-800">
      {/* Pane 1: Conversations History Sidebar */}
      <Sidebar />

      {/* Main workspace container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Pane 2: Document Library Manager */}
        <div className="w-80 border-r border-slate-800 h-full flex flex-col">
          <DocumentManager />
        </div>

        {/* Pane 3: Grounded Chat Workspace */}
        <div className="flex-1 h-full flex flex-col">
          <ChatWindow />
        </div>
        
      </div>
    </div>
  );
};
