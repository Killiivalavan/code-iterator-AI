'use client';

import React from 'react';
import CodeIterator from '@/components/CodeIterator';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col cursor-ui">
      {/* Cursor-like header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center">
        <div className="flex items-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
            <path d="M18 3L6 10L12 12.5L4 16L6 21L21 14L18 3Z" fill="#3B82F6" />
          </svg>
          <span className="font-semibold text-white">Code Iterator AI</span>
        </div>
        <div className="flex items-center space-x-4 ml-auto text-sm text-gray-400">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
            <span>Connected to API</span>
          </div>
          <a href="https://github.com/your-username/code-iterator-ai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
            GitHub
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Docs
          </a>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-grow overflow-hidden bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="h-full max-w-7xl mx-auto p-4">
          <CodeIterator />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 px-4 py-2 text-xs text-gray-500 flex justify-between">
        <div>
          Powered by <span className="text-blue-400">Groq</span> and <span className="text-gray-400">Ollama</span>
        </div>
        <div>
          © {new Date().getFullYear()} Code Iterator AI
        </div>
      </footer>
    </main>
  );
} 