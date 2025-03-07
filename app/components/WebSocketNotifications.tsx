import React, { useState, useEffect, useRef } from 'react';
import { X, BrainCircuit, Loader2, AlertCircle, Download, Maximize2, Minimize2 } from 'lucide-react';

const AIThinkingWebSocket = () => {
  const [pastMessages, setPastMessages] = useState<any>([]);
  const [messages, setMessages] = useState<any>([]);
  const [allMessages, setAllMessages] = useState<any>([]);
  const [isOpen, setIsOpen] = useState<any>(false);
  const [isMinimized, setIsMinimized] = useState<any>(false);
  const [wsStatus, setWsStatus] = useState<any>('disconnected');
  const [sessionHistory, setSessionHistory] = useState<any>([]);
  const [currentSessionId, setCurrentSessionId] = useState<any>(null);
  const [showSessionHistory, setShowSessionHistory] = useState<any>(false);
  const contentRef = useRef<any>(null);
  const wsRef = useRef<any>(null);
  // Ref to ensure session initialization happens only once per session.
  const sessionStartedRef = useRef(false);

  // When a session is active, display allMessages; otherwise use messages.
  const displayedMessages = currentSessionId ? allMessages : messages;

  // Connect to WebSocket on mount.
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Auto-scroll on new content.
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [displayedMessages]);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket('ws://localhost:8765');
      wsRef.current = ws;
      setWsStatus('connecting');
      
      ws.onopen = () => {
        setWsStatus('connected');
        console.log('WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        // Initialize session only once.
        if (!sessionStartedRef.current) {
          sessionStartedRef.current = true;
          setIsOpen(true);
          setIsMinimized(false);
          const newSessionId = Date.now();
          setCurrentSessionId(newSessionId);
          setMessages([]);
          setAllMessages([]);
        }
        // Append the incoming message.
        setMessages((prev: any) => [...prev, event.data]);
        setAllMessages((prev: any) => [...prev, event.data]);
      };
      
      ws.onclose = () => {
        setWsStatus('disconnected');
        console.log('WebSocket disconnected');
        
        // Save the current session if messages exist.
        if (messages.length > 0 && currentSessionId) {
          const timestamp = new Date().toISOString();
          const sessionContent = messages.join('\n');
          setSessionHistory((prev: any) => [
            ...prev,
            {
              id: currentSessionId,
              content: sessionContent,
              timestamp
            }
          ]);
          setCurrentSessionId(null);
          sessionStartedRef.current = false;
        }
        // Reconnect after a delay.
        setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };
      
      ws.onerror = (error) => {
        setWsStatus('error');
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setWsStatus('error');
    }
  };

  const closePopup = () => {
    // Save the current session before closing.
    if (messages.length > 0 && currentSessionId) {
      const timestamp = new Date().toISOString();
      const sessionContent = messages.join('\n');
      setSessionHistory((prev: any) => [
        ...prev,
        {
          id: currentSessionId,
          content: sessionContent,
          timestamp
        }
      ]);
    }
    setIsOpen(false);
    setMessages([]);
    setAllMessages([]);
    setCurrentSessionId(null);
    sessionStartedRef.current = false;
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const toggleSessionHistory = () => {
    setShowSessionHistory(!showSessionHistory);
  };

  const viewPastSession = (sessionId: any) => {
    const session = sessionHistory.find((s: any) => s.id === sessionId);
    if (session) {
      setMessages(session.content.split('\n'));
      setCurrentSessionId(null);
      setShowSessionHistory(false);
    }
  };

  const downloadTranscript = () => {
    const content = displayedMessages.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-transcript-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Enhanced formatting function to support advanced markdown styling.
  const formatContent = (text: any) => {
    if (!text) return '';

    let formattedText = text;

    // Custom tags formatting.
    formattedText = formattedText
      .replace(/<think>/g, '<span class="text-blue-500 font-bold">&lt;think&gt;</span>')
      .replace(/<\/think>/g, '<span class="text-blue-500 font-bold">&lt;/think&gt;</span>')
      .replace(/<query>/g, '<span class="text-purple-500 font-bold">&lt;query&gt;</span>')
      .replace(/<\/query>/g, '<span class="text-purple-500 font-bold">&lt;/query&gt;</span>')
      .replace(/<search>/g, '<span class="text-green-500 font-bold">&lt;search&gt;</span>')
      .replace(/<\/search>/g, '<span class="text-green-500 font-bold">&lt;/search&gt;</span>')
      .replace(/==== FINAL ANSWER====/g, '<span class="text-red-500 font-bold">==== FINAL ANSWER====</span>')
      .replace(/>> Iteration: (\d+)/g, '<span class="text-orange-500 font-bold">>> Iteration: $1</span>');

    // Markdown headings.
    formattedText = formattedText
      .replace(/^### (.*$)/gim, '<h3 class="text-2xl font-bold my-4">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold my-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold my-4">$1</h1>');

    // Bold text using **text**.
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic text using *text*.
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Process unordered lists.
    let lines = formattedText.split('\n');
    let inList = false;
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*-\s+/.test(lines[i])) {
        if (!inList) {
          lines[i] = '<ul class="list-disc ml-6">' + lines[i].replace(/^\s*-\s+/, '<li>') + '</li>';
          inList = true;
        } else {
          lines[i] = lines[i].replace(/^\s*-\s+/, '<li>') + '</li>';
        }
        // If the next line isn’t a list item, close the list.
        if (i === lines.length - 1 || !/^\s*-\s+/.test(lines[i + 1])) {
          lines[i] = lines[i] + '</ul>';
          inList = false;
        }
      }
    }
    formattedText = lines.join('\n');

    // Wrap paragraphs by replacing double-newlines.
    formattedText = formattedText.replace(/\n\n/g, '</p><p>');
    formattedText = '<p>' + formattedText + '</p>';
    return formattedText;
  };

  const statusIndicator: any = {
    connected: { class: 'bg-green-500', text: 'Connected' },
    connecting: { class: 'bg-yellow-500 animate-pulse', text: 'Connecting...' },
    disconnected: { class: 'bg-red-500', text: 'Disconnected' },
    error: { class: 'bg-red-500', text: 'Connection Error' }
  };

  if (!isOpen && !isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg flex items-center justify-center"
          title="Open AI Processing"
        >
          <BrainCircuit className="h-12 w-12" />
        </button>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Main Window */}
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
      <div className={`relative bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col ${isMinimized ? 'w-64' : 'w-[700px] h-[500px]'}`}>
        {/* Header */}
        <div className="bg-gray-900 p-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="h-5 w-5 text-blue-400" />
            <span className="text-white font-semibold">AI Processing</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <div className={`h-2 w-2 rounded-full mr-2 ${statusIndicator[wsStatus].class}`}></div>
              {!isMinimized && (
                <span className="text-xs text-gray-300">{statusIndicator[wsStatus].text}</span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {!isMinimized && (
              <>
                <button 
                  onClick={downloadTranscript}
                  className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700"
                  title="Download Transcript"
                >
                  <Download className="h-4 w-4" />
                </button>

              </>
            )}
            {isMinimized ? (
              <button 
                onClick={toggleMinimize}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            ) : (
              <button 
                onClick={toggleMinimize}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            )}
            <button 
              onClick={closePopup}
              className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Content Area */}
        {!isMinimized && (
          <div 
            ref={contentRef}
            className="flex-grow p-4 overflow-y-auto bg-gray-900 text-gray-200 font-mono text-sm"
          >
            {showSessionHistory ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Session History</h3>
                {sessionHistory.length > 0 ? (
                  <ul className="space-y-2">
                    {sessionHistory.map((session: any) => (
                      <li key={session.id} className="p-2 bg-gray-800 rounded hover:bg-gray-700 cursor-pointer" onClick={() => viewPastSession(session.id)}>
                        <div className="text-sm font-medium">{new Date(session.timestamp).toLocaleString()}</div>
                        <div className="text-xs text-gray-400 truncate">{session.content.substring(0, 100)}...</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No previous sessions found.</p>
                )}
                <button 
                  onClick={toggleSessionHistory}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Back to Current Session
                </button>
              </div>
            ) : displayedMessages.length > 0 ? (
              <div className="space-y-1">
                {displayedMessages.map((message: any, index: number) => (
                  <div 
                    key={index} 
                    className="pb-1 border-b border-gray-800 last:border-0"
                    dangerouslySetInnerHTML={{ __html: formatContent(message) }}
                  />
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="text-center p-6 bg-gray-800 rounded-lg">
                  <Loader2 className="h-8 w-8 text-blue-400 mx-auto mb-4 animate-spin" />
                  <p className="text-lg text-gray-300">Search Something for Analyzing ...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Bar */}
        {/* {!isMinimized && (
          <div className="bg-gray-900 p-2 text-xs text-gray-400 flex justify-between items-center border-t border-gray-800">
            <div className="flex items-center">
              <span className="mr-2">Connection:</span>
              ws://localhost:8765
            </div>
          </div>
        )} */}
        <div className="fixed bottom-8 right-20 z-50 flex flex-col size-9">
            <button 
                onClick={toggleSessionHistory}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700"
                title="View Session History"
            >
                History
            </button>
        </div>
      </div>
    </div>
  );
};

export default AIThinkingWebSocket;
