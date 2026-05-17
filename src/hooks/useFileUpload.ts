// src/hooks/useFileUpload.ts
'use client';

import { useState, useRef, useCallback } from 'react';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export interface FileUploadState {
  file: File | null;
  fileText: string;
  dragging: boolean;
  error: string | null;
  dragProps: {
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    onClick: () => void;
  };
  processFile: (f: File) => Promise<void>;
  reset: () => void;
}

export function useFileUpload(): FileUploadState {
  const [file, setFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState('');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (f: File) => {
    setError(null);

    // Size check
    if (f.size > MAX_SIZE) {
      setError('File is too large. Max size is 5 MB.');
      return;
    }

    // Type check
    const isDocx = f.name.toLowerCase().endsWith('.docx');
    if (!ACCEPTED_TYPES.includes(f.type) && !isDocx) {
      setError('Unsupported file type. Please upload PDF, TXT, DOC, or DOCX.');
      return;
    }

    setFile(f);

    // PDF extraction
    if (f.type === 'application/pdf') {
      try {
        const arrayBuffer = await f.arrayBuffer();
        // Dynamic import to avoid SSR issues with pdfjs-dist
        const pdfjs = await import('pdfjs-dist');
        // Use the legacy build worker to avoid webpack issues
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const pages: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          pages.push(content.items.map((item: any) => item.str).join(' '));
        }
        setFileText(pages.join('\n'));
      } catch (err) {
        setError('Failed to extract text from PDF.');
        setFileText(`[PDF file: ${f.name} – ${(f.size / 1024).toFixed(1)} KB]`);
      }
      return;
    }

    // TXT extraction
    if (f.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => setFileText(e.target?.result as string);
      reader.readAsText(f);
      return;
    }

    // DOC / DOCX — placeholder (no real parsing)
    setFileText(`[Resume file: ${f.name} – ${(f.size / 1024).toFixed(1)} KB]`);
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setFileText('');
    setError(null);
  }, []);

  const dragProps = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) processFile(f);
    },
    onClick: () => {
      document.getElementById('resume-file-input')?.click();
    },
  };

  return { file, fileText, dragging, error, dragProps, processFile, reset };
}
