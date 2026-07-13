import React, { useRef, useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { UploadCloud, FileText, CheckSquare, Square, Trash2, Sparkles, BookOpen } from 'lucide-react';

export const DocumentManager: React.FC = () => {
  const {
    documents,
    selectedDocumentIds,
    loadingDocs,
    activeSummary,
    loadingSummary,
    setActiveSummary,
    toggleSelectDocument,
    loadDocuments,
    uploadDocument,
    deleteDocument,
    summarizeDocument
  } = useChat();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF documents are supported.');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      await uploadDocument(file);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full flex flex-col h-full bg-white/20 backdrop-blur-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-accent" />
            <span>Document Library</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">Upload PDFs and select documents to ground your AI assistant.</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
          dragActive 
            ? 'border-primary bg-primary/10 shadow-glass-glow-light' 
            : 'border-slate-350 hover:border-primary/50 bg-white/80 hover:bg-white shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        {uploading ? (
          <div className="flex flex-col items-center space-y-3">
            <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></span>
            <p className="text-base font-bold text-primary">Uploading & Indexing PDF...</p>
            <p className="text-xs text-slate-500">Extracting text & generating vector embeddings</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
              <UploadCloud className="w-6 h-6 text-slate-550" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-700">Drag & Drop PDF file or click to browse</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Supports PDF format up to 20MB</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-650 text-sm rounded-xl shadow-sm">
          {error}
        </div>
      )}

      {/* Document List */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-2.5 pr-1">
        {loadingDocs ? (
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="h-16 bg-white/80 border border-slate-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-base border border-slate-200 rounded-2xl bg-white/40">
            No documents uploaded yet
          </div>
        ) : (
          documents.map((doc) => {
            const isSelected = selectedDocumentIds.includes(doc.id);
            return (
              <div
                key={doc.id}
                className={`p-4 rounded-xl border transition-all duration-200 flex items-center justify-between shadow-sm ${
                  isSelected 
                    ? 'bg-accent/10 border-accent/40 text-slate-900' 
                    : 'bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  {/* Custom Checkbox */}
                  <button
                    onClick={() => toggleSelectDocument(doc.id)}
                    className={`focus:outline-none transition-colors duration-150 ${isSelected ? 'text-accent' : 'text-slate-400 hover:text-slate-500'}`}
                  >
                    {isSelected ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                  </button>
                  <FileText className="w-6 h-6 text-slate-450 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-base font-bold text-slate-900 truncate max-w-[170px]" title={doc.name}>
                      {doc.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      {formatBytes(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => summarizeDocument(doc.id)}
                    title="Generate Summary"
                    className="p-2 hover:bg-slate-100 text-slate-400 hover:text-accent rounded-lg border border-transparent hover:border-slate-200 transition-all duration-200"
                  >
                    <Sparkles className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete document "${doc.name}"? This will delete all search indexes.`)) {
                        deleteDocument(doc.id);
                      }
                    }}
                    title="Delete Document"
                    className="p-2 hover:bg-slate-100 text-slate-400 hover:text-red-500 rounded-lg border border-transparent hover:border-slate-200 transition-all duration-200"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary View Panel */}
      {loadingSummary && (
        <div className="p-4 bg-white/90 border border-slate-200 rounded-2xl flex flex-col space-y-3 items-center text-center shadow-md">
          <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></span>
          <p className="text-sm text-accent font-bold">Generating Executive Summary...</p>
        </div>
      )}
      
      {!loadingSummary && activeSummary && (
        <div className="p-4 bg-white/95 border border-primary/20 rounded-2xl flex flex-col space-y-2 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between border-b border-slate-150 pb-2 mb-1">
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-accent flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>Document Summary</span>
            </h4>
            <button
              onClick={() => setActiveSummary(null)}
              className="text-xs text-slate-450 hover:text-slate-600 font-bold"
            >
              Close
            </button>
          </div>
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto font-medium">
            {activeSummary.summary}
          </p>
        </div>
      )}
    </div>
  );
};
