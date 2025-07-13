import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import { LogOut, User, Users, Camera, Eye, EyeOff, Download, BarChart3 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmotionAnalysis() {
  // Base URL configuration
  const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

  const navigate = useNavigate();

  const handleLogout = () => {
    stopCamera();    // To safely stop the camera before leaving
    navigate("/login");
  };

  // New state for mode toggle
  const [analysisMode, setAnalysisMode] = useState('single'); // 'single' or 'multiple'
  const [modeTransitioning, setModeTransitioning] = useState(false);

  // State variables
  const [cameraActive, setCameraActive] = useState(false);
  const [topEmotion, setTopEmotion] = useState('-');
  const [secondEmotion, setSecondEmotion] = useState('-');
  const [distressPercentage, setDistressPercentage] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState('00:00');
  const [recordingStatus, setRecordingStatus] = useState('');
  const [statusColor, setStatusColor] = useState('');
  const [emotionColor, setEmotionColor] = useState('');
  const [downloadLinks, setDownloadLinks] = useState({ report: '', chart: '' });
  const [analysisResults, setAnalysisResults] = useState([]);
  const [totalPeopleAnalyzed, setTotalPeopleAnalyzed] = useState(0);

  // Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const recordingStartTimeRef = useRef(null);
  const recordingMaxTime = 10; // 10 seconds

  // Handle mode change with transition
  const handleModeChange = (mode) => {
    setModeTransitioning(true);

    // Reset analysis results
    setTopEmotion('-');
    setSecondEmotion('-');
    setDistressPercentage(0);
    setEmotionColor('');
    setAnalysisResults([]);
    setTotalPeopleAnalyzed(0);

    setTimeout(() => {
      setAnalysisMode(mode);
      setModeTransitioning(false);
    }, 1000);
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video: true});

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      streamRef.current = stream;
      console.log('Camera started');

      // Reset emotion display
      setTopEmotion('-');
      setSecondEmotion('-');
      setDistressPercentage(0);
      setAnalysisResults([]);
      setTotalPeopleAnalyzed(0);

    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access the camera. Please check permissions and try again.');
      setCameraActive(false);
    }
  };

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      streamRef.current = null;
      console.log('Camera stopped');
    }

    // Stop recording if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      stopRecording();
    }
  }, []);

  // Update recording timer
  const updateRecordingTimer = () => {
    if (!recordingStartTimeRef.current) return;

    const elapsedSeconds = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
    const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');

    setRecordingTime(`${minutes}:${seconds}`);

    // Auto-stop if reached max time
    if (elapsedSeconds >= recordingMaxTime) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        stopRecording();
      }
    }
  };

  // Start recording
  const startRecording = () => {
    if (!streamRef.current) {
      alert('Camera must be turned on to record.');
      return;
    }

    recordedChunksRef.current = [];

    try {
      const mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
      const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        uploadRecording();
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingStatus('Recording...');
      setStatusColor('text-red-500');

      setTopEmotion('-');
      setSecondEmotion('-');
      setDistressPercentage(0);
      setEmotionColor('');
      setAnalysisResults([]);
      setTotalPeopleAnalyzed(0);

      recordingStartTimeRef.current = Date.now();
      updateRecordingTimer();
      timerIntervalRef.current = setInterval(updateRecordingTimer, 1000);

      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          stopRecording();
        }
      }, recordingMaxTime * 1000);

      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not start recording. Please try again.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingStatus('Processing...');
      setStatusColor('text-blue-500');

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      console.log('Recording stopped');
    }
  };

  // Calculate group statistics from results
  const calculateGroupStats = (results) => {
    if (!results || results.length === 0) {
      return {
        topEmotion: '-',
        secondEmotion: '-',
        distressPercentage: 0,
        emotionDistribution: {},
        isGroupDistressed: false,
        criticalEmotionSpike: null,
      };
    }

    const combinedEmotionScores = {};
    let totalDistress = 0;
    let userCount = results.length;

    results.forEach((result) => {
      const emotionCounts = result.emotion_counts || {};
      const totalFrames = Object.values(emotionCounts).reduce((sum, count) => sum + count, 0);
      const distressWeight = (result.distress_percentage || 0) / 100;

      // Normalize and optionally weight emotions
      for (const [emotion, count] of Object.entries(emotionCounts)) {
        const normalized = totalFrames > 0 ? count / totalFrames : 0;
        const weighted = normalized * (1 + distressWeight); // amplify based on distress
        combinedEmotionScores[emotion] = (combinedEmotionScores[emotion] || 0) + weighted;
      }

      totalDistress += result.distress_percentage || 0;
    });

    // Sort emotions by aggregated score
    const sortedEmotions = Object.entries(combinedEmotionScores)
        .sort(([, a], [, b]) => b - a)
        .map(([emotion]) => emotion);

    // Compute total distress average
    const averageDistress = totalDistress / userCount;

    // Optional alert flags
    const isGroupDistressed = averageDistress > 70;

    const criticalEmotions = ['fear', 'angry', 'sad'];
    let criticalSpike = null;
    for (const [emotion, score] of Object.entries(combinedEmotionScores)) {
      if (criticalEmotions.includes(emotion) && score > userCount * 0.4) {
        criticalSpike = emotion;
        break;
      }
    }

    return {
      topEmotion: sortedEmotions[0] || '-',
      secondEmotion: sortedEmotions[1] || '-',
      distressPercentage: parseFloat(averageDistress.toFixed(1)),
      emotionDistribution: combinedEmotionScores,
      isGroupDistressed,
      criticalEmotionSpike: criticalSpike, // e.g., 'fear' or null
    };
  };

  // Upload video to backend API
  const uploadRecording = async () => {
    try {
      setRecordingStatus('Analyzing emotions...');

      const mimeType = mediaRecorderRef.current.mimeType || 'video/mp4';
      const blob = new Blob(recordedChunksRef.current, { type: mimeType });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `emotion-recording-${timestamp}.mp4`;

      const formData = new FormData();
      formData.append('video', blob, filename);

      // Get student_id from localStorage or use a default
      const studentId = localStorage.getItem("student_id") || "unknown";
      formData.append('student_id', studentId);

      const response = await fetch(`${BASE_URL}/api/upload_video`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Server response:', result);

      setRecordingStatus('Analysis complete!');
      setStatusColor('text-green-500');

      // Store the raw results
      setAnalysisResults(result.results || []);
      setTotalPeopleAnalyzed(result.total_people_analyzed || 0);

      // Update UI based on analysis mode
      if (analysisMode === 'single') {
        // For single mode, show the first person's results
        const firstResult = result.results && result.results.length > 0 ? result.results[0] : {};
        console.log(firstResult);
        setTopEmotion(firstResult.top_emotion || '-');
        setSecondEmotion(firstResult.second_emotion || '-');
        setDistressPercentage(firstResult.distress_percentage || 0);

        // Set color based on distress level
        if (firstResult.distress_level > 70) {
          setEmotionColor('text-red-500');
        } else if (firstResult.distress_level > 40) {
          setEmotionColor('text-yellow-500');
        } else {
          setEmotionColor('text-green-500');
        }
      } else {
        // For multiple mode, show group statistics
        const groupStats = calculateGroupStats(result.results);
        console.log("Group stats"+groupStats);
        setTopEmotion(groupStats.topEmotion);
        setSecondEmotion(groupStats.secondEmotion);
        setDistressPercentage(groupStats.distressPercentage);

        // Set color based on group distress level
        if (groupStats.distressPercentage > 70) {
          setEmotionColor('text-red-500');
        } else if (groupStats.distressPercentage > 40) {
          setEmotionColor('text-yellow-500');
        } else {
          setEmotionColor('text-green-500');
        }
      }

      // Set download links if available
      if (result.report_path || result.chart_path) {
        setDownloadLinks({
          report: result.report_path ? `${BASE_URL}${result.report_path}` : '',
          chart: result.chart_path ? `${BASE_URL}${result.chart_path}` : ''
        });
      }

      setTimeout(() => {
        setRecordingStatus('');
      }, 5000);

    } catch (error) {
      console.error('Error uploading recording:', error);
      setRecordingStatus(`Error: ${error.message}`);
      setStatusColor('text-red-500');

      setTimeout(() => {
        setRecordingStatus('');
      }, 5000);
    }
  };

  // Effect for camera toggle
  useEffect(() => {
    if (cameraActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [cameraActive, stopCamera]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      stopCamera();
    };
  }, [stopCamera]);

  return (
      <div className="bg-gradient-to-br from-blue-50 to-white min-h-screen py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-900 mb-4">Emotion Analysis for Classroom Students</h1>
            <p className="text-lg text-blue-600 max-w-3xl mx-auto">
              Understand student emotions in real-time to enhance classroom engagement and learning experience.
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="max-w-md mx-auto mb-8">
            <div className="bg-white rounded-xl shadow-lg p-2 border border-blue-100">
              <div className="flex bg-blue-50 rounded-lg">
                <button
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                        analysisMode === 'single'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-blue-600 hover:bg-blue-100'
                    }`}
                    onClick={() => handleModeChange('single')}
                    disabled={modeTransitioning}
                >
                  <User className="h-5 w-5" />
                  Single Student
                </button>
                <button
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                        analysisMode === 'multiple'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-blue-600 hover:bg-blue-100'
                    }`}
                    onClick={() => handleModeChange('multiple')}
                    disabled={modeTransitioning}
                >
                  <Users className="h-5 w-5" />
                  Multiple Students
                </button>
              </div>
            </div>
          </div>

          {/* Mode Transition Loading */}
          {modeTransitioning && (
              <div className="max-w-2xl mx-auto mb-8 text-center">
                <div className="bg-white rounded-lg shadow-md p-6 border border-blue-100">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <p className="text-blue-700 font-medium">
                      Switching to {analysisMode === 'single' ? 'Multiple' : 'Single'} Student Mode...
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                    <Skeleton className="h-4 w-1/2 mx-auto" />
                  </div>
                </div>
              </div>
          )}

          {/* Mode Description */}
          {!modeTransitioning && (
              <div className="max-w-2xl mx-auto mb-8 text-center">
                <div className="bg-white rounded-lg shadow-md p-4 border border-blue-100">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {analysisMode === 'single' ? (
                        <User className="h-5 w-5 text-blue-600" />
                    ) : (
                        <Users className="h-5 w-5 text-blue-600" />
                    )}
                    <span className="font-semibold text-blue-800">
                  {analysisMode === 'single' ? 'Individual Analysis Mode' : 'Group Analysis Mode'}
                </span>
                  </div>
                  <p className="text-blue-700">
                    {analysisMode === 'single'
                        ? 'Analyzing emotions for one student at a time with detailed individual insights and focused attention detection.'
                        : 'Analyzing emotions for multiple students simultaneously with group dynamics overview and classroom engagement metrics.'
                    }
                  </p>
                </div>
              </div>
          )}

          {/* Main Analysis Panel */}
          <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
            {/* Panel Header */}
            <div className={`${analysisMode === 'single' ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-purple-600 to-purple-700'} p-6 text-white transition-all duration-500`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-semibold flex items-center gap-2">
                    {analysisMode === 'single' ? <User className="h-6 w-6" /> : <Users className="h-6 w-6" />}
                    {analysisMode === 'single' ? 'Individual' : 'Group'} Emotion Analysis
                  </h3>
                  <p className={`${analysisMode === 'single' ? 'text-blue-100' : 'text-purple-100'} mt-1`}>
                    {analysisMode === 'single'
                        ? 'Real-time emotion detection for focused learning'
                        : 'Classroom-wide emotion monitoring for better engagement'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {cameraActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    <span className="text-sm">Camera</span>
                  </div>
                  <Switch
                      checked={cameraActive}
                      onCheckedChange={setCameraActive}
                  />
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Video Feed */}
                <div className="space-y-4">
                  <h4 className="text-xl font-semibold text-blue-900 flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Live Feed
                    {analysisMode === 'multiple' && (
                        <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      Multi-Face Detection
                    </span>
                    )}
                  </h4>
                  <div className={`relative bg-gray-100 rounded-xl overflow-hidden shadow-inner border-2 ${analysisMode === 'single' ? 'border-blue-100' : 'border-purple-100'} transition-all duration-500`} style={{ aspectRatio: '16/9' }}>
                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                    ></video>
                    {!cameraActive && (
                        <div className={`absolute inset-0 flex items-center justify-center ${analysisMode === 'single' ? 'bg-blue-50' : 'bg-purple-50'} transition-all duration-500`}>
                          <div className="text-center p-6">
                            <div className={`w-16 h-16 ${analysisMode === 'single' ? 'bg-blue-200' : 'bg-purple-200'} rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-500`}>
                              {analysisMode === 'single' ?
                                  <User className={`h-8 w-8 ${analysisMode === 'single' ? 'text-blue-600' : 'text-purple-600'}`} /> :
                                  <Users className={`h-8 w-8 ${analysisMode === 'single' ? 'text-blue-600' : 'text-purple-600'}`} />
                              }
                            </div>
                            <p className={`${analysisMode === 'single' ? 'text-blue-600' : 'text-purple-600'} font-medium transition-all duration-500`}>
                              Camera is disabled
                            </p>
                            <p className={`${analysisMode === 'single' ? 'text-blue-500' : 'text-purple-500'} text-sm transition-all duration-500`}>
                              Toggle the camera switch to start {analysisMode} analysis
                            </p>
                          </div>
                        </div>
                    )}
                    {/* Mode indicator overlay */}
                    {cameraActive && (
                        <div className="absolute top-4 right-4">
                          <div className={`${analysisMode === 'single' ? 'bg-blue-600' : 'bg-purple-600'} text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 transition-all duration-500`}>
                            {analysisMode === 'single' ? <User className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                            {analysisMode === 'single' ? '1:1 Mode' : 'Multi Mode'}
                          </div>
                        </div>
                    )}
                  </div>
                </div>

                {/* Results Panel */}
                <div className="space-y-4">
                  <h4 className="text-xl font-semibold text-blue-900 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Analysis Results
                    {analysisMode === 'multiple' && totalPeopleAnalyzed > 0 && (
                        <span className="text-sm text-purple-600 ml-2">
                      ({totalPeopleAnalyzed} people detected)
                    </span>
                    )}
                  </h4>

                  <div className="space-y-4">
                    <div className={`${analysisMode === 'single' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'} border p-4 rounded-xl hover:shadow-md transition-all duration-500`}>
                      <p className={`${analysisMode === 'single' ? 'text-blue-900' : 'text-purple-900'} font-medium mb-1 transition-all duration-500`}>
                        {analysisMode === 'single' ? 'Top Emotion' : 'Dominant Group Emotion'}
                      </p>
                      <p className={`text-2xl font-bold ${analysisMode === 'single' ? 'text-blue-700' : 'text-purple-700'} ${emotionColor} transition-all duration-500`}>
                        {topEmotion}
                      </p>
                    </div>

                    <div className={`${analysisMode === 'single' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'} border p-4 rounded-xl hover:shadow-md transition-all duration-500`}>
                      <p className={`${analysisMode === 'single' ? 'text-blue-900' : 'text-purple-900'} font-medium mb-1 transition-all duration-500`}>
                        {analysisMode === 'single' ? 'Second Most Common' : 'Secondary Group Emotion'}
                      </p>
                      <p className={`text-2xl font-bold ${analysisMode === 'single' ? 'text-blue-700' : 'text-purple-700'} ${emotionColor} transition-all duration-500`}>
                        {secondEmotion}
                      </p>
                    </div>

                    <div className={`${analysisMode === 'single' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'} border p-4 rounded-xl hover:shadow-md transition-all duration-500`}>
                      <p className={`${analysisMode === 'single' ? 'text-blue-900' : 'text-purple-900'} font-medium mb-3 transition-all duration-500`}>
                        {analysisMode === 'single' ? 'Emotional Distress Level' : 'Group Distress Level'}
                      </p>
                      <div className="relative">
                        <div className={`h-8 ${analysisMode === 'single' ? 'bg-blue-200' : 'bg-purple-200'} rounded-full overflow-hidden transition-all duration-500`}>
                          <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                  distressPercentage > 70 ? 'bg-red-500' :
                                      distressPercentage > 40 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${distressPercentage}%` }}
                          ></div>
                        </div>
                        <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${analysisMode === 'single' ? 'text-blue-900' : 'text-purple-900'} transition-all duration-500`}>
                        {distressPercentage.toFixed(1)}%
                      </span>
                      </div>
                    </div>

                    {/* Individual Results for Multiple Mode */}
                    {analysisMode === 'multiple' && analysisResults.length > 0 && (
                        <div className="bg-purple-50 border-purple-200 border p-4 rounded-xl">
                          <p className="text-purple-900 font-medium mb-3">Individual Student Results</p>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {analysisResults.map((result, index) => (
                                <div key={index} className="bg-white p-3 rounded-lg border border-purple-100">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-purple-800">Name: {result.username}</span>
                                    <span className={`text-sm px-2 py-1 rounded ${
                                        result.distress_percentage > 70 ? 'bg-red-100 text-red-700' :
                                            result.distress_percentage > 40 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-green-100 text-green-700'
                                    }`}>
                                {result.top_emotion}
                              </span>
                                  </div>
                                  <div className="text-xs text-purple-600 mt-1">
                                    Distress: {result.distress_percentage?.toFixed(1)}%
                                  </div>
                                </div>
                            ))}
                          </div>
                        </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recording Controls */}
              <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-3">
                    <button
                        className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                            cameraActive && !isRecording
                                ? `${analysisMode === 'single' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'} text-white shadow-md hover:shadow-lg`
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        onClick={startRecording}
                        disabled={!cameraActive || isRecording}
                    >
                      Start Recording
                    </button>

                    <button
                        className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                            isRecording
                                ? 'bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        onClick={stopRecording}
                        disabled={!isRecording}
                    >
                      Stop Recording
                    </button>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="bg-white border border-blue-200 px-4 py-2 rounded-lg">
                      <span className="text-blue-900 font-mono text-lg">{recordingTime}</span>
                    </div>
                    {recordingStatus && (
                        <div className={`font-medium px-3 py-1 rounded-full text-sm ${statusColor} bg-white border`}>
                          {recordingStatus}
                        </div>
                    )}
                  </div>
                </div>

                {/* Download Links */}
                {(downloadLinks.report || downloadLinks.chart) && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <p className="text-gray-700 font-medium mb-3">Analysis Reports:</p>
                      <div className="flex flex-wrap gap-3">
                        {downloadLinks.report && (
                            <a
                                href={downloadLinks.report}
                                target="_blank"
                                rel="noreferrer"
                                className={`${analysisMode === 'single' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'} text-white px-4 py-2 rounded-lg transition-colors shadow-md hover:shadow-lg`}
                      >
                        View Chart
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}