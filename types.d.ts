import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module '@monaco-editor/react';
declare module 'monaco-editor';
declare module 'axios';

export {}; 