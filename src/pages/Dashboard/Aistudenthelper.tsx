import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Home,
  Book,
  Calendar,
  Headphones,
  Settings,
  LogOut,
  Bell,
  Search,
  FileText,
  MessageSquare,
  Upload,
  Send,
  Paperclip,
  X,
  Trash2,
  Bot,
  User,
  Copy,
  RefreshCw,
  Mic,
  MicOff,
  Pin,
  Brain,
  FileAudio,
  Sparkles,
  History,
  Plus, Download,
  Users,
  CalendarIcon,
  BookOpen,
  BarChart
} from "lucide-react";
import { Link } from "react-router-dom";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import ReactMarkdown from "react-markdown";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  duration: string;
  uploadDate: string;
  audioUrl: string;
  subject?: string;
  isPinned?: boolean;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: string;
  relatedFile?: string;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messages: ChatMessage[];
}
type Recording = {
  id: number;
  title: string;
  subject: string;
  date: string;
  duration: string;
  audioUrl: string;
  notes: string;
  quiz?: string;
  size: string;
  preview?: string;
  keywords?: string[];
};
const AIStudentHelper = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';
  const [sessionId, setSessionId] = useState(null);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
    {
      id: '1',
      name: 'Physics Lecture - Quantum Mechanics.mp3',
      size: '15.2 MB',
      duration: '45:30',
      uploadDate: '2025-01-06',
      audioUrl: '#',
      subject: 'Physics',
      isPinned: true
    },
    {
      id: '2',
      name: 'Mathematics - Calculus Integration.mp3',
      size: '12.8 MB',
      duration: '38:15',
      uploadDate: '2025-01-05',
      audioUrl: '#',
      subject: 'Mathematics'
    }
  ]);

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    {
      id: '1',
      title: 'Quantum Mechanics Discussion',
      lastMessage: 'Can you explain the uncertainty principle?',
      timestamp: '2025-01-06 14:30',
      messages: [
        {
          id: '1',
          type: 'user',
          content: 'Can you explain the uncertainty principle?',
          timestamp: '2:30 PM'
        },
        {
          id: '2',
          type: 'bot',
          content: 'The uncertainty principle states that you cannot simultaneously know both the position and momentum of a particle with perfect accuracy.',
          timestamp: '2:31 PM'
        }
      ]
    },
    {
      id: '2',
      title: 'Calculus Integration Help',
      lastMessage: 'How do I solve integration by parts?',
      timestamp: '2025-01-05 16:45',
      messages: [
        {
          id: '1',
          type: 'user',
          content: 'How do I solve integration by parts?',
          timestamp: '4:45 PM'
        },
        {
          id: '2',
          type: 'bot',
          content: 'Integration by parts follows the formula: ∫u dv = uv - ∫v du. Choose u and dv wisely.',
          timestamp: '4:46 PM'
        }
      ]
    }
  ]);

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hello! I'm your AI Study Assistant. Upload your class recordings and I'll help you understand the content by answering any questions you have about the lectures.",
      timestamp: '10:00 AM'
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const startNewChat = () => {
    // Just reset to initial state, don't create new session
    setChatMessages([
      {
        id: '1',
        type: 'bot',
        content: "Hello! I'm your AI Study Assistant. Upload your class recordings and I'll help you understand the content by answering any questions you have about the lectures.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setCurrentSessionId(null);
  };

  const loadChatSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setChatMessages(session.messages);
      setCurrentSessionId(sessionId);
      setShowHistory(false);
    }
  };

  const deleteChatSession = (sessionId: string) => {
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      startNewChat();
    }
  };

  const generateChatTitle = (firstMessage: string): string => {
    const words = firstMessage.split(' ').slice(0, 4).join(' ');
    return words.length > 30 ? words.substring(0, 30) + '...' : words;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);

      setTimeout(() => {
        const newFile: UploadedFile = {
          id: Date.now().toString(),
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          duration: '00:00',
          uploadDate: new Date().toISOString().split('T')[0],
          audioUrl: URL.createObjectURL(file),
          subject: 'General'
        };

        setUploadedFiles(prev => [newFile, ...prev]);
        setIsUploading(false);

        const successMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'bot',
          content: `Great! I've successfully processed "${file.name}". You can now ask me any questions about this lecture recording.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, successMessage]);
      }, 2000);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      relatedFile: selectedFile || undefined
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await axios.post(`${BASE_URL}/api/chat`, {
        message: inputMessage,
        session_id: sessionId
      });

      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot' as const,
        content: response.data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Chat API error:', error);
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot' as const,
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };
  const loadChatHistory = React.useCallback(async () => {
    if (!sessionId) return;

    try {
      const response = await axios.get(`${BASE_URL}/api/get-chat-history/${sessionId}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json'
        }
      });

      const history = response.data.history || [];

      // Convert API format to your message format
      const formattedMessages: ChatMessage[] = [
        {
          id: '1',
          type: 'bot',
          content: "Hello! I'm your AI Study Assistant. Upload your class recordings and I'll help you understand the content by answering any questions you have about the lectures.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];

      history.forEach((item, index) => {
        formattedMessages.push({
          id: `user-${index}`,
          type: 'user' as const,
          content: item.message,
          timestamp: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        formattedMessages.push({
          id: `bot-${index}`,
          type: 'bot' as const,
          content: item.response,
          timestamp: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      });

      setChatMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
    }
  }, [sessionId, BASE_URL]);
  const generateBotResponse = (question: string): string => {
    const responses = [
      "Based on the lecture recording, this concept relates to the fundamental principles discussed around minute 15:30. The professor explained that quantum mechanics operates on probability distributions rather than deterministic outcomes.",
      "From the uploaded audio, I can help clarify this topic. The key mathematical relationship involves theoretical foundation covered in the first 10 minutes and practical applications from 35:00 onwards.",
      "This is an excellent question! The professor mentioned this concept around the 23-minute mark. The integration by parts formula is particularly useful when dealing with products of functions.",
      "According to the lecture content, this question touches on wave-particle duality, superposition principle, and measurement problem. The professor emphasized this around minute 18:45."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const startVoiceRecording = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setInputMessage("Can you explain the concept of superposition in quantum mechanics?");
    }, 2000);
  };

  const deleteFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    if (selectedFile === fileId) {
      setSelectedFile(null);
    }
  };

  const toggleFilePin = (fileId: string) => {
    setUploadedFiles(prev => prev.map(file =>
      file.id === fileId ? { ...file, isPinned: !file.isPinned } : file
    ));
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const filteredFiles = uploadedFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });
  const [username, setUsername] = useState("");
  const [userImage, setUserImage] = useState("");
  const [savedRecordings, setSavedRecordings] = useState<Recording[]>([]);
  const fetchRecordings = React.useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/classes`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json'
        }
      });
      return response.data.classes || [];
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
      return [];
    }
  }, [BASE_URL]);
  useEffect(() => {
    const storedUsername = localStorage.getItem("username") || "";
    const storedUserImage = localStorage.getItem("user_image") || "";

    setUsername(storedUsername);
    setUserImage(storedUserImage);
  }, [fetchRecordings]);

  useEffect(() => {
    if (sessionId) {
      loadChatHistory();
    }
  }, [loadChatHistory, sessionId]);

  useEffect(() => {
    const loadRecordings = async () => {
      const recordings = await fetchRecordings();
      interface ApiRecording {
        class_title?: string;
        subject?: string;
        date?: string;
        original_filename?: string;
        transcript_preview?: string;
        notes_file?: string;
        quiz_file?: string;
      }

      const formatted = recordings.map((item: ApiRecording, index: number) => ({
        id: index + 1,
        title: item.class_title || 'Untitled',
        subject: item.subject || 'General',
        date: item.date ? item.date.split(' ')[0] : new Date().toISOString().split('T')[0],
        duration: '—', // backend doesn't return this, you can calculate if needed
        audioUrl: item.original_filename || '#',
        preview: item.transcript_preview || '',
        notes: item.notes_file || '',
        quiz: item.quiz_file || '',
        size: '—' // backend doesn't return size
      }));
      setSavedRecordings(formatted);
    };

    loadRecordings();
  }, [fetchRecordings]);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  useEffect(() => {
    const storedSessionId = localStorage.getItem("user_id");
    setSessionId(storedSessionId);
  }, []);
  return (
      <div className="flex h-screen bg-gray-50">
         {/* Sidebar */}
              <div 
                className={`bg-white shadow-md transition-all duration-300 ${
                  collapsed ? "w-20" : "w-64"
                }`}
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className={`flex items-center ${collapsed ? "justify-center w-full" : ""}`}>
                    {!collapsed && (
                      <img src="https://i.postimg.cc/VNj3jq6w/1.png" alt="HearLink Logo" className="h-8 w-auto mr-3" />
                    )}
                    {!collapsed && <span className="text-xl font-bold text-hearlink-900">HearLink</span>}
                    {collapsed && <img src=" https://i.postimg.cc/VNj3jq6w/1.png" alt="HearLink" className="h-8 w-auto" />}
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className={`p-1 rounded-full hover:bg-gray-200 ${collapsed ? "hidden" : ""}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                      />
                    </svg>
                  </button>
                </div>
                <nav className="p-4">
                  <ul className="space-y-2">
                    <li>
                      <Link
                        to="/student-dashboard"
                        className="flex items-center p-2 rounded-lg hover:bg-blue-50 text-gray-600"
                      >
                        <Home className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                        {!collapsed && <span>Dashboard</span>}
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/student-courses"
                        className="flex items-center p-2 rounded-lg hover:bg-blue-50 text-gray-600"
                      >
                        <Book className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                        {!collapsed && <span>My Courses</span>}
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/student-calendar"
                        className="flex items-center p-2 rounded-lg hover:bg-blue-50 text-blue-900 bg-blue-50"
                      >
                        <CalendarIcon className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                        {!collapsed && <span>Calendar</span>}
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="https://monumental-starlight-979bdd.netlify.app/"
                        className="flex items-center p-2 rounded-lg hover:bg-blue-50 text-gray-600"
                      >
                        <Headphones className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                        {!collapsed && <span>Speech to Text</span>}
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/learning_materials"
                        className="flex items-center p-2 rounded-lg hover:bg-blue-50 text-gray-600"
                      >
                        <FileText className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                        {!collapsed && <span>Learning Materials</span>}
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/Aistudenthelper"
                        className="flex items-center p-2 rounded-lg bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                      >
                        <MessageSquare className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                        {!collapsed && <span>AI Study Helper</span>}
                      </Link>
                    </li>
                    
                  </ul>
                  <div className="border-t border-gray-200 mt-6 pt-6">
                    <ul className="space-y-2">
                      <li>
                        <Link
                          to="/student-settings"
                          className="flex items-center p-2 rounded-lg hover:bg-blue-50 text-gray-600"
                        >
                          <Settings className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                          {!collapsed && <span>Settings</span>}
                        </Link>
                                      </li>
                                      <li>
                                                      <Link
                                                        to="/login"
                                                        className="flex items-center p-2 rounded-lg hover:bg-red-50 text-red-600"
                                                      >
                                                        <LogOut className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                                                        {!collapsed && <span>Logout</span>}
                                                      </Link>
                                                    </li>
                                    </ul>
                                  </div>
                                </nav>
                              </div>

        {/* Chat History Sidebar */}
        {showHistory && (
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Chat History</h2>
                  <Button size="sm" variant="ghost" onClick={toggleHistory}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={startNewChat}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {chatSessions.map((session) => (
                      <Card
                          key={session.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                              currentSessionId === session.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                          }`}
                          onClick={() => loadChatSession(session.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2">
                                {session.title}
                              </h3>
                              <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                                {session.lastMessage}
                              </p>
                              <div className="text-xs text-gray-400">
                                {new Date(session.timestamp).toLocaleDateString()}
                              </div>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteChatSession(session.id);
                                }}
                                className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                  ))}

                  {chatSessions.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">No chat history yet</p>
                        <p className="text-xs mt-1">Start chatting to see your conversations here</p>
                      </div>
                  )}
                </div>
              </ScrollArea>
            </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between border-b border-gray-200">
            <button onClick={toggleSidebar} className="p-1 rounded-full hover:bg-gray-200 lg:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search files or conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={toggleHistory} className="text-gray-600 hover:text-gray-800">
                <History className="h-4 w-4 mr-1" />
                History
              </Button>
              <Button variant="outline" size="sm" onClick={startNewChat} className="text-gray-600 hover:text-gray-800">
                <RefreshCw className="h-4 w-4 mr-1" />
                New Chat
              </Button>
              <button className="p-2 rounded-full hover:bg-gray-100 relative">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 bg-red-500 rounded-full w-2 h-2"></span>
              </button>
              {/* Profile image circle */}
              <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-zinc-300">
                {userImage ? (
                    <img
                        src={`data:image/png;base64,${userImage}`}
                        alt="Profile"
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center bg-zinc-700 text-white">
      <span className="text-lg font-semibold">
        {username ? username.charAt(0).toUpperCase() : "?"}
      </span>
                    </div>
                )}
              </div>
              <div className="ml-4">
                {/* "Welcome Back" with a distinct color */}
                <p className="text-sm text-zinc-600">Welcome </p>

                {/* Username with a stronger color for emphasis */}
                <p className="text-sm  font-medium text-black italic "  >{username ? username : "Guest"}</p>
              </div>

            </div>
          </header>

          {/* Main Content Area - Better Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Chat Area - Reduced width to give more space to sidebar */}
            <div className="flex-1 flex flex-col bg-white min-w-0 max-w-4xl">
              {/* Chat Header */}
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Bot className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h1 className="text-lg font-semibold text-gray-900">AI Study Assistant</h1>
                    <p className="text-sm text-gray-500">Ask questions about your uploaded lectures</p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 max-w-3xl mx-auto">
                  {chatMessages.map((message) => (
                      <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-2xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-3' : 'mr-3'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                message.type === 'user' ? 'bg-blue-600' : 'bg-gray-200'
                            }`}>
                              {message.type === 'user' ? (
                                  <User className="h-4 w-4 text-white" />
                              ) : (
                                  <Bot className="h-4 w-4 text-gray-600" />
                              )}
                            </div>
                          </div>
                          <div className={`group relative ${message.type === 'user' ? 'text-right' : ''}`}>
                            <div className={`rounded-2xl px-4 py-3 ${
                                message.type === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-900'
                            }`}>
                              {message.type === 'bot' ? (
                                <ReactMarkdown 
                                  components={{
                                    p: ({children}) => <p className="text-sm mb-2 last:mb-0">{children}</p>,
                                    strong: ({children}) => <strong className="font-bold text-gray-900">{children}</strong>
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              ) : (
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              )}
                              {message.relatedFile && (
                                  <div className="mt-2 pt-2 border-t border-blue-500/20">
                                    <p className="text-xs opacity-75">
                                      📎 {uploadedFiles.find(f => f.id === message.relatedFile)?.name}
                                    </p>
                                  </div>
                              )}
                            </div>

                            {/* Message Actions */}
                            <div className={`flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                                message.type === 'user' ? 'justify-end' : 'justify-start'
                            }`}>
                              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => copyMessage(message.content)}>
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                              <span className="text-xs text-gray-500">{message.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                  ))}

                  {isTyping && (
                      <div className="flex justify-start">
                        <div className="flex max-w-2xl">
                          <div className="flex-shrink-0 mr-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <Bot className="h-4 w-4 text-gray-600" />
                            </div>
                          </div>
                          <div className="bg-gray-100 rounded-2xl px-4 py-3">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4 bg-white">
                {selectedFile && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                      <div className="flex items-center">
                        <FileAudio className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm text-blue-700">
                  Referencing: {uploadedFiles.find(f => f.id === selectedFile)?.name}
                </span>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedFile(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                )}

                <div className="flex items-end space-x-3">
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="border-blue-200 hover:bg-blue-50"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>

                  <div className="flex-1 relative">
                    <Textarea
                        ref={messageInputRef}
                        placeholder="Ask a question about your lectures..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        className="min-h-[40px] max-h-24 resize-none focus:ring-blue-500 focus:border-blue-500 pr-12"
                        rows={1}
                    />
                    <Button
                        size="sm"
                        variant="ghost"
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                            isRecording ? 'text-red-500' : 'text-gray-400'
                        }`}
                        onClick={startVoiceRecording}
                    >
                      {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </div>

                  <Button
                      onClick={sendMessage}
                      disabled={!inputMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700 px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
              />
            </div>

            {/* Past Classes Sidebar - Expanded with better design */}
            <div className="w-96 bg-white border-l border-gray-200 flex-shrink-0 flex flex-col">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Your Past Classes</h2>
                    <p className="text-blue-100 text-sm">Recorded lectures by your teachers</p>
                  </div>
                </div>
                <div className="text-sm text-blue-100 mt-3">
                  Access your lecture recordings, notes, and practice quizzes
                </div>
              </div>

              {/* Classes List */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <div className="space-y-4">
                  {savedRecordings.map((recording, index) => (
                      <div key={recording.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all duration-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900 mb-2 leading-tight">
                              {recording.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="font-medium">Subject: Computer Science</span>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed mb-3">
                              Interactive lecture covering key concepts with practical examples and Q&A session.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                          <Calendar className="h-4 w-4" />
                          <span>Uploaded: {recording.date}</span>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <div className="text-sm text-gray-700 mb-1">
                            <span className="font-semibold text-gray-900">Preview:</span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {recording.preview}
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <Button
                              size="sm"
                              className="text-sm px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg shadow-sm flex-1 font-medium"
                              onClick={async () => {
                                const res = await fetch(`${BASE_URL}/api/download/pdf/${encodeURIComponent(recording.notes)}`);
                                const blob = await res.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = recording.notes;
                                a.click();
                                window.URL.revokeObjectURL(url);
                              }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Notes
                          </Button>
                          <Button
                              size="sm"
                              variant="outline"
                              className="text-sm px-4 py-2 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 rounded-lg flex-1 font-medium text-blue-600"
                              onClick={async () => {
                                const res = await fetch(`${BASE_URL}/api/download/pdf/${encodeURIComponent(recording.quiz)}`);
                                const blob = await res.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = recording.quiz;
                                a.click();
                                window.URL.revokeObjectURL(url);
                              }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Get Quiz
                          </Button>
                        </div>
                      </div>
                  ))}

                  {savedRecordings.length === 0 && (
                      <div className="text-center text-gray-500 py-12">
                        <div className="bg-gray-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                          <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Yet</h3>
                        <p className="text-sm text-gray-500 mb-1">Your teacher hasn't uploaded any lectures yet</p>
                        <p className="text-xs text-gray-400">Check back later for new content</p>
                      </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default AIStudentHelper;