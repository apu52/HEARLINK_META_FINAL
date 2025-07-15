
import React, { useState, useRef, useEffect } from "react";
import {
  Home,
  Users,
  Calendar,
  BookOpen,
  Settings,
  LogOut,
  Bell,
  Search,
  Plus,
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Download,
  Upload,
  FileText,
  Clock,
  Loader2,
  Eye,
  Trash2,
  Share2,
  MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import axios from 'axios';

const ClassRecording = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState("");
  const [classTitle, setClassTitle] = useState("");
  const [classSubject, setClassSubject] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

  // Sample saved recordings data
  const [savedRecordings, setSavedRecordings] = useState<Recording[]>([]);

  // New state for API response
  const [generatedQuiz, setGeneratedQuiz] = useState("");
  const [processedFiles, setProcessedFiles] = useState<{ notes_pdf?: string, quiz_pdf?: string }>({});
  const [transcript, setTranscript] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);

  const fetchRecordings = async () => {
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
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const updateAudioLevel = () => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 255 * 100);

      if (isRecording && !isPaused) {
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Setup audio level monitoring
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/mp3' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        setAudioLevel(0);
      };

      mediaRecorder.start();
      setIsRecording(true);

      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      updateAudioLevel();
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Error starting recording. Please check your microphone permissions.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        intervalRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
        updateAudioLevel();
      } else {
        mediaRecorderRef.current.pause();
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        setAudioLevel(0);
      }
      setIsPaused(!isPaused);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const restartRecording = () => {
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioUrl("");
    setGeneratedNotes("");
    setGeneratedQuiz("");
    setTranscript("");
    setKeywords([]);
    setProcessedFiles({});
    setClassTitle("");
    setClassSubject("");
    setAudioLevel(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const generateNotes = async () => {
    if (!audioBlob || !classTitle) {
      alert('Please ensure you have recorded audio and entered a class title.');
      return;
    }

    setIsGeneratingNotes(true);

    const formData = new FormData();
    formData.append("audio_file", audioBlob, `${classTitle}.mp3`);
    formData.append("class_title", classTitle);

    try {
      const response = await fetch(`${BASE_URL}/api/process-audio`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to process audio: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update state with API response
        setGeneratedNotes(data.notes || "");
        setGeneratedQuiz(data.quiz || "");
        setProcessedFiles(data.files || {});
        setTranscript(data.transcript || "");
        setKeywords(data.keywords || []);

        console.log('Notes generated successfully:', data);
      } else {
        throw new Error('API returned success: false');
      }
    } catch (err) {
      console.error("Error generating notes:", err);
      alert(`Error generating notes: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const saveRecording = async () => {
    if (audioBlob && classTitle && generatedNotes) {
      try {
        const newRecording = {
          id: savedRecordings.length + 1,
          title: classTitle,
          subject: classSubject,
          date: new Date().toISOString().split('T')[0],
          duration: formatTime(recordingTime),
          audioUrl: audioUrl,
          notes: generatedNotes,
          quiz: generatedQuiz,
          size: `${(audioBlob.size / (1024 * 1024)).toFixed(1)} MB`,
          preview: transcript.substring(0, 100) + '...',
          keywords: keywords
        };

        setSavedRecordings(prev => [newRecording, ...prev]);

        // Reset form
        restartRecording();
        alert('Recording saved successfully!');
      } catch (error) {
        console.error('Error saving recording:', error);
        alert('Error saving recording. Please try again.');
      }
    } else {
      alert('Please ensure you have recorded audio, entered a class title, and generated notes before saving.');
    }
  };

  const downloadAudio = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.mp3`;
    a.click();
  };

  const downloadNotes = (notes: string, filename: string) => {
    const blob = new Blob([notes], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_notes.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadQuiz = (quiz: string, filename: string) => {
    const blob = new Blob([quiz], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_quiz.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  const uploadToStudents = (recording: Recording) => {
    // Simulate upload to student dashboard
    alert(`Notes for "${recording.title}" uploaded to student dashboard successfully!`);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  useEffect(() => {
    type ApiRecording = {
      class_title?: string;
      subject?: string;
      date?: string;
      original_filename?: string;
      transcript_preview?: string;
      notes_file?: string;
      quiz_file?: string;
    };

    const loadRecordings = async () => {
      const recordings: ApiRecording[] = await fetchRecordings();
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
  }, []);

  return (
      <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        {/* Sidebar */}
        <div
            className={`bg-white shadow-xl border-r border-blue-100 transition-all duration-300 ${
                collapsed ? "w-20" : "w-64"
            }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-blue-100">
            <div className={`flex items-center ${collapsed ? "justify-center w-full" : ""}`}>
              {!collapsed && (
                <img src="https://i.postimg.cc/VNj3jq6w/1.png " alt="HearLink Logo" className="h-8 w-auto mr-3" />
              )}
              {!collapsed && <span className="text-xl font-bold text-hearlink-900">HearLink</span>}
              {collapsed && <img src="https://i.postimg.cc/VNj3jq6w/1.png" alt="HearLink" className="h-8 w-auto" />}
            </div>
            <button
                onClick={toggleSidebar}
                className={`p-1 rounded-full hover:bg-blue-50 transition-colors ${collapsed ? "hidden" : ""}`}
            >
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-600"
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
                    to="/teacher-dashboard"
                    className="flex items-center p-3 rounded-xl hover:bg-blue-50 text-gray-600 transition-all duration-200 hover:text-blue-600"
                >
                  <Home className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                  {!collapsed && <span className="font-medium">Dashboard</span>}
                </Link>
              </li>
              <li>
                <Link
                    to="/Classes"
                    className="flex items-center p-3 rounded-xl hover:bg-blue-50 text-gray-600 transition-all duration-200 hover:text-blue-600"
                >
                  <Users className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                  {!collapsed && <span className="font-medium">Classes</span>}
                </Link>
              </li>
              <li>
                <Link
                    to="/Calendar"
                    className="flex items-center p-3 rounded-xl hover:bg-blue-50 text-gray-600 transition-all duration-200 hover:text-blue-600"
                >
                  <Calendar className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                  {!collapsed && <span className="font-medium">Calendar</span>}
                </Link>
              </li>
              <li>
                <Link
                    to="/teacher-materials"
                    className="flex items-center p-3 rounded-xl hover:bg-blue-50 text-gray-600 transition-all duration-200 hover:text-blue-600"
                >
                  <BookOpen className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                  {!collapsed && <span className="font-medium">Materials</span>}
                </Link>
              </li>
              <li>
                <a
                    href="/emotion_analysis"
                    className="flex items-center p-3 rounded-xl hover:bg-blue-50 text-gray-600 transition-all duration-200 hover:text-blue-600"
                >
                  <MessageSquare className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                  {!collapsed && <span className="font-medium">Emotion Analysis</span>}
                </a>
              </li>
              <li>
                <Link
                    to="/Classrecording"
                    className="flex items-center p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                >
                  <Mic className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                  {!collapsed && <span className="font-medium">Record Classes</span>}
                </Link>
              </li>
            </ul>
            <div className="border-t border-blue-100 mt-6 pt-6">
              <ul className="space-y-2">
                <li>
                  <Link
                      to="/teacher-settings"
                      className="flex items-center p-3 rounded-xl hover:bg-blue-50 text-gray-600 transition-all duration-200 hover:text-blue-600"
                  >
                    <Settings className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                    {!collapsed && <span className="font-medium">Settings</span>}
                  </Link>
                </li>
                <li>
                  <Link
                      to="/login"
                      className="flex items-center p-3 rounded-xl hover:bg-red-50 text-red-600 transition-all duration-200"
                  >
                    <LogOut className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                    {!collapsed && <span className="font-medium">Logout</span>}
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navigation */}
          <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-blue-100 z-10">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-xl hover:bg-blue-50 md:hidden transition-colors"
                >
                  <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                  >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16m-7 6h7"
                    />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Class Recording</h1>
                  <p className="text-sm text-blue-600">Record and generate smart notes</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button className="relative p-3 text-gray-600 hover:bg-blue-50 rounded-xl transition-colors">
                  <Bell className="h-6 w-6" />
                  <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>
                <div className="ml-4 flex items-center bg-white rounded-xl p-2 shadow-sm border border-blue-100">
                  <img
                      src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
                      alt="User Avatar"
                      className="h-10 w-10 rounded-xl object-cover"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-semibold text-gray-900">Prof. David Lee</p>
                    <p className="text-xs text-blue-600">Physics Teacher</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Recording Panel */}
                <div className="xl:col-span-2">
                  <Card className="mb-6 border-0 shadow-xl bg-white/70 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <Mic className="h-6 w-6" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold">Record New Class</h2>
                          <p className="text-blue-100 text-sm">Start recording and generate AI notes</p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 p-6">
                      {/* Class Details */}
                      <div className="flex gap-6">
                        {/* Class Title */}
                        <div className="w-1/2 space-y-2">
                          <Label htmlFor="class-title" className="text-gray-700 font-medium">Class Title</Label>
                          <Input
                              id="class-title"
                              placeholder="Enter class title..."
                              value={classTitle}
                              onChange={(e) => setClassTitle(e.target.value)}
                              className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl"
                          />
                        </div>
                        {/* Class Subject */}
                        <div className="w-1/2 space-y-2">
                          <Label htmlFor="class-subject" className="text-gray-700 font-medium">Subject (Optional)</Label>
                          <Input
                              id="class-subject"
                              placeholder="e.g., Mathematics, Physics..."
                              value={classSubject}
                              onChange={(e) => setClassSubject(e.target.value)}
                              className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl"
                          />
                        </div>
                      </div>

                      {/* Recording Controls */}
                      <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 text-center border border-blue-100">
                        <div className="mb-6">
                          <div className={`mx-auto w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                              isRecording ? 'bg-gradient-to-r from-red-400 to-red-500 shadow-lg shadow-red-500/30 animate-pulse' : 'bg-gradient-to-r from-blue-400 to-blue-500 shadow-lg shadow-blue-500/30'
                          }`}>
                            <Mic className={`h-16 w-16 text-white`} />
                          </div>
                        </div>

                        {/* Audio Level Indicator */}
                        {isRecording && !isPaused && (
                            <div className="mb-4">
                              <div className="flex justify-center items-center gap-1 mb-2">
                                {[...Array(20)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-1 h-8 rounded-full transition-all duration-100 ${
                                            i < (audioLevel / 5) ? 'bg-gradient-to-t from-blue-500 to-blue-400' : 'bg-gray-200'
                                        }`}
                                        style={{
                                          height: `${Math.max(8, (audioLevel / 5) > i ? 32 : 8)}px`,
                                        }}
                                    />
                                ))}
                              </div>
                              <p className="text-xs text-gray-500">Audio Level: {Math.round(audioLevel)}%</p>
                            </div>
                        )}

                        <div className="mb-6">
                          <div className="text-4xl font-mono font-bold text-gray-700 mb-2">
                            {formatTime(recordingTime)}
                          </div>
                          <div className={`text-sm font-medium px-3 py-1 rounded-full inline-block ${
                              isRecording ? (isPaused ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700') : 'bg-gray-100 text-gray-600'
                          }`}>
                            {isRecording ? (isPaused ? 'Recording Paused' : 'Recording in Progress...') : 'Ready to Record'}
                          </div>
                        </div>

                        <div className="flex justify-center gap-4">
                          {!isRecording ? (
                              <Button
                                  onClick={startRecording}
                                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/30 px-8 py-3 rounded-xl font-semibold"
                                  disabled={!classTitle}
                              >
                                <Mic className="h-5 w-5 mr-3" />
                                Start Recording
                              </Button>
                          ) : (
                              <>
                                <Button
                                    onClick={pauseRecording}
                                    variant="outline"
                                    className="border-2 border-yellow-400 text-yellow-600 hover:bg-yellow-50 px-6 py-3 rounded-xl font-semibold"
                                >
                                  {isPaused ? <Play className="h-5 w-5 mr-2" /> : <Pause className="h-5 w-5 mr-2" />}
                                  {isPaused ? 'Resume' : 'Pause'}
                                </Button>
                                <Button
                                    onClick={stopRecording}
                                    className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 px-6 py-3 rounded-xl font-semibold"
                                >
                                  <Square className="h-5 w-5 mr-2" />
                                  Stop
                                </Button>
                              </>
                          )}
                          <Button
                              onClick={restartRecording}
                              variant="outline"
                              className="border-2 border-gray-300 hover:bg-gray-50 px-6 py-3 rounded-xl font-semibold"
                          >
                            <RotateCcw className="h-5 w-5 mr-2" />
                            Reset
                          </Button>
                        </div>
                      </div>

                      {/* Audio Review */}
                      {audioUrl && (
                          <div className="border-2 border-blue-100 rounded-2xl p-6 bg-white/50">
                            <h3 className="font-semibold mb-4 flex items-center gap-3 text-gray-800">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Volume2 className="h-5 w-5 text-blue-600" />
                              </div>
                              Audio Review
                            </h3>
                            <audio
                                ref={audioRef}
                                controls
                                className="w-full mb-4 rounded-xl"
                                src={audioUrl}
                            />
                            <div className="flex gap-3">
                              <Button
                                  onClick={generateNotes}
                                  disabled={isGeneratingNotes || !classTitle}
                                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/30 rounded-xl"
                              >
                                {isGeneratingNotes ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <FileText className="h-4 w-4 mr-2" />
                                )}
                                Generate Notes
                              </Button>
                              <Button
                                  onClick={() => downloadAudio(audioUrl, classTitle || 'recording')}
                                  variant="outline"
                                  className="border-2 border-blue-200 hover:bg-blue-50 rounded-xl"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download Audio
                              </Button>
                            </div>
                          </div>
                      )}

                      {/* Generated Notes */}
                      {isGeneratingNotes && (
                          <div className="border-2 border-blue-100 rounded-2xl p-8 text-center bg-gradient-to-br from-blue-50 to-white">
                            <div className="relative">
                              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
                              <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                            </div>
                            <p className="text-gray-700 font-medium mb-1">Generating notes from audio...</p>
                            <p className="text-sm text-blue-600">AI is processing your recording</p>
                          </div>
                      )}

                      {generatedNotes && (
                          <div className="border-2 border-green-100 rounded-2xl p-6 bg-gradient-to-br from-green-50 to-white">
                        <div className="relative">
                          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
                          <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                        </div>
                        <p className="text-gray-700 font-medium mb-1">Generating notes from audio...</p>
                        <p className="text-sm text-blue-600">AI is processing your recording</p>
                      </div>
                    )}

                    {generatedNotes && (
                      <div className="border-2 border-green-100 rounded-2xl p-6 bg-gradient-to-br from-green-50 to-white">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold flex items-center gap-3 text-gray-800">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <FileText className="h-5 w-5 text-green-600" />
                            </div>
                            Generated Notes
                          </h3>
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => setShowPreview(!showPreview)}
                              className="border-green-200 hover:bg-green-50 rounded-lg"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {showPreview ? 'Hide' : 'Preview'}
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => downloadNotes(generatedNotes, classTitle || 'notes')}
                              className="border-green-200 hover:bg-green-50 rounded-lg"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                        {showPreview && (
                          <div className="bg-white rounded-xl p-4 max-h-64 overflow-y-auto mb-4 border border-green-100">
                            <pre className="whitespace-pre-wrap text-sm text-gray-700">{generatedNotes}</pre>
                          </div>
                        )}
                        <Button 
                          onClick={saveRecording}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/30 rounded-xl font-semibold py-3"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Save Recording & Notes
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Saved Recordings */}
              <div>
                <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold">Past Classes</h3>
                        <p className="text-blue-100 text-sm">{savedRecordings.length} saved classes</p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {savedRecordings.map((recording, index) => (
                        <div key={recording.id} className={`border-2 rounded-xl p-4 hover:shadow-lg transition-all duration-200 ${
                          index === 0 ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200 bg-white/50'
                        }`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm line-clamp-2 text-gray-800">{recording.title}</h4>

                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">

                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            <span>Uploaded on: {recording.date}</span>

                          </div>
                          <div className='text-sm text-gray-700 mb-2'>Preview: <span className='text-xs'>{recording.preview}</span></div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="text-xs px-3 py-2 h-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg shadow-sm"
                              onClick={async () => {
                                const res = await fetch(`${BASE_URL}/api/download/pdf/${encodeURIComponent(recording.notes)}`,{
                                  headers:{
                                    'ngrok-skip-browser-warning':'true'
                                  }
                                });
                                const blob = await res.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = recording.notes;
                                a.click();
                                window.URL.revokeObjectURL(url);
                              }}
                            >
                              <Download className="h-3 w-3 mr-1" />
                             Notes
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs px-3 py-2 h-8 border-blue-200 hover:bg-blue-50 rounded-lg"
                              onClick={async () => {
                              const res = await fetch(`${BASE_URL}/api/download/pdf/${encodeURIComponent(recording.quiz)}`, {
                                    headers: {
                                      'ngrok-skip-browser-warning': 'true'
                                    }
                                  }
                                );
                              const blob = await res.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = recording.quiz;
                              a.click();
                              window.URL.revokeObjectURL(url);
                            }}
                              >
                            <Download className="h-3 w-3 mr-1" />
                              Quiz
                          </Button>

                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClassRecording;
