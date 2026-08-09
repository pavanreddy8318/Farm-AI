/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

interface VoiceDictatorProps {
  onTranscript: (text: string) => void;
  onStateChange?: (isListening: boolean) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export default function VoiceDictator({ 
  onTranscript, 
  onStateChange, 
  className = '', 
  size = 'md' 
}: VoiceDictatorProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Clean up recognition instance on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    setError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError("Web Speech API is not supported in this browser. Please use Chrome, Safari, or Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        onStateChange?.(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onTranscript(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError("Microphone permission denied. Please allow mic access or open the app in a new tab.");
        } else if (event.error === 'no-speech') {
          // Gracefully handle silent pauses or empty dictation attempts
          setError("Silent timeout: No speech was detected. Tap again to dictate.");
        } else {
          setError(`Voice capture failed: ${event.error}`);
        }
        setIsListening(false);
        onStateChange?.(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        onStateChange?.(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to initialize speech recognition:', err);
      setError(err.message || "Failed to start voice dictation module.");
      setIsListening(false);
      onStateChange?.(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    onStateChange?.(false);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Auto-clear error after 5 seconds to not clutter UI
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const buttonSizeClass = size === 'sm' ? 'p-1.5' : 'p-3';

  return (
    <div className="relative inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        className={`relative rounded-none border flex items-center justify-center transition-all ${
          isListening
            ? 'bg-rose-600 border-rose-600 text-white animate-pulse'
            : 'bg-white border-editorial-border hover:border-editorial-dark text-editorial-dark'
        } ${buttonSizeClass} ${className}`}
        title={isListening ? "Listening... click to stop" : "Start Voice Dictation"}
      >
        {isListening ? (
          <span className="relative flex h-4 w-4 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <Mic className="relative w-4 h-4 text-white" />
          </span>
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>

      {/* Inline tiny error overlay banner */}
      {error && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-editorial-dark border border-neutral-700 p-2 text-[9px] text-white shadow-xl flex items-start gap-1 z-50 animate-fade-in">
          <AlertCircle className="w-3 h-3 text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="font-serif leading-snug">{error}</p>
        </div>
      )}

      {isListening && (
        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-rose-600 animate-pulse flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1">
          <span className="h-1.5 w-1.5 bg-rose-600 rounded-full animate-ping"></span>
          Listening Field Note...
        </span>
      )}
    </div>
  );
}
