import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import {
  User,
  Users,
  Calendar,
  BookOpen,
  Settings,
  LogOut,
  Bell,
  Search,
  Plus,
  MessageSquare,
  BarChart,
  FileText,
  Headphones,
  Home,
  Info,
  AlertCircle,
  Check,
  X,
  Loader,
  Mic,
  AlertTriangle,
  Flame
} from "lucide-react";
import axios from "axios";

const TeacherAnalytics = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  // Mock BASE_URL for demo - replace with your actual URL
  const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

  const toggleSidebar = () => setCollapsed(!collapsed);

  useEffect(() => {
    const fetchStudents = async () => {
      // Mock data based on your API response structure
      // const mockApiResponse = {
      //   data: [
      //     {
      //       "alert_triggered": true,
      //       "chart_image": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      //       "distress_percentage": 68.62745098039215,
      //       "emotion_distribution": {
      //         "angry": 20,
      //         "neutral": 16,
      //         "sad": 15
      //       },
      //       "id": 1,
      //       "second_emotion": "neutral",
      //       "timestamp": "2025-07-08 16:20:03",
      //       "top_emotion": "angry",
      //       "total_frames": 51,
      //       "user_id": 1,
      //       "username": "Priyadeep Mullick"
      //     },
      //     {
      //       "alert_triggered": false,
      //       "chart_image": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      //       "distress_percentage": 25.5,
      //       "emotion_distribution": {
      //         "happy": 30,
      //         "neutral": 20,
      //         "sad": 5
      //       },
      //       "id": 2,
      //       "second_emotion": "neutral",
      //       "timestamp": "2025-07-08 16:20:03",
      //       "top_emotion": "happy",
      //       "total_frames": 55,
      //       "user_id": 2,
      //       "username": "John Smith"
      //     }
      //   ],
      //   status: "success",
      //   total_analyses: 2
      // };

      try {
        // Uncomment this for real API call
        const generateHeaders = () => {
          const headers = {
            'Content-Type': 'application/json'
          };
          if (BASE_URL.includes('ngrok')) {
            headers['ngrok-skip-browser-warning'] = 'true';
          }
          return headers;
        };

        const res = await axios.get(`${BASE_URL}/api/emotion_dashboard`, {
          headers: generateHeaders()
        });


        // For demo, using mock data
        // const res = { data: mockApiResponse };

        console.log("API Response:", res.data);

        const fetchedStudents = Array.isArray(res.data.data)
            ? res.data.data.map((s, index) => {
              console.log("Processing student:", s.username, "with emotion:", s.top_emotion);

              // Generate emotion distribution for pie chart
              const emotionsDistribution = Object.entries(s.emotion_distribution || {}).map(([emotion, value]) => ({
                name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
                value: value,
                color: getEmotionColor(emotion)
              }));

              // Clean and validate base64 data
              const cleanBase64 = s.chart_image ? s.chart_image.replace(/^data:image\/[a-z]+;base64,/, '') : '';
              const isValidImage = validateBase64Image(s.chart_image);

              console.log(`Image validation for ${s.username}:`, {
                originalLength: s.chart_image?.length,
                cleanedLength: cleanBase64.length,
                isValid: isValidImage,
                preview: s.chart_image?.substring(0, 100)
              });

              return {
                id: s.id,
                name: s.username,
                status: s.top_emotion,
                studentId: `S-${s.id.toString().padStart(4, "0")}`,
                grade: "10A",
                initials: getInitials(s.username),
                chartImageBase64: isValidImage ? cleanBase64 : null,
                alertTriggered: s.alert_triggered,
                distressPercentage: Math.round(s.distress_percentage || 0),
                emotions: {
                  engagement: Math.max(0, 100 - (s.distress_percentage || 0)),
                  focus: Math.random() * 100, // Mock data
                  satisfaction: Math.random() * 100, // Mock data
                  distress: Math.round(s.distress_percentage || 0),
                  confusion: Math.random() * 25 // Mock data
                },
                emotionsDistribution: emotionsDistribution,
                totalFrames: s.total_frames,
                timestamp: s.timestamp
              };
            })
            : [];

        setStudents(fetchedStudents);
        console.log("Processed students:", fetchedStudents);
      } catch (error) {
        console.error("Failed to fetch students:", error);
      }
    };

    fetchStudents();
  }, []);

  const getEmotionColor = (emotion) => {
    const colors = {
      happy: "#10B981",
      sad: "#EF4444",
      angry: "#F59E0B",
      neutral: "#6B7280",
      fearful: "#8B5CF6",
      surprised: "#06B6D4"
    };
    return colors[emotion] || "#6B7280";
  };

  const validateBase64Image = (base64String) => {
    if (!base64String || typeof base64String !== 'string') {
      return false;
    }

    // Remove data URL prefix if present
    const cleanBase64 = base64String.replace(/^data:image\/[a-z]+;base64,/, '');

    // Check if it's a valid base64 string
    try {
      // Basic validation - should be valid base64 and reasonable length
      const decoded = atob(cleanBase64);
      return decoded.length > 100; // Very small check to ensure it's not empty
    } catch (e) {
      console.error("Invalid base64 string:", e);
      return false;
    }
  };

  const getInitials = (name) => {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase();
  };

  const getStatusColor = (status) => {
    console.log("Getting status color for:", status);
    switch (status?.toLowerCase()) {
      case "happy":
        return "bg-green-500";
      case "sad":
        return "bg-red-500";
      case "neutral":
        return "bg-yellow-500";
      case "angry":
        return "bg-orange-600";
      case "fearful":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "happy":
        return <Check className="h-3 w-3" />;
      case "sad":
        return <X className="h-3 w-3" />;
      case "neutral":
        return <AlertCircle className="h-3 w-3" />;
      case "angry":
        return <Flame className="h-3 w-3" />;
      case "fearful":
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <AlertTriangle className="h-3 w-3" />;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case "happy":
        return "Positive";
      case "sad":
        return "Distressed";
      case "neutral":
        return "Neutral";
      case "angry":
        return "Angry";
      case "fearful":
        return "Fearful";
      default:
        return "Unknown";
    }
  };



  const handleCheckStudent = (student) => {
    console.log("Checking student:", student);
    setSelectedStudent(student);
    setLoading(true);
    setReportGenerated(false);

    setTimeout(() => {
      setLoading(false);
      setTimeout(() => setReportGenerated(true), 500);
    }, 1500);
  };

  const positiveStudents = students.filter(s => s.status === "happy" || s.status === "neutral");
  const distressedStudents = students.filter(s => s.status === "sad" || s.status === "angry" || s.status === "fearful");

  return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className={`bg-white shadow-md transition-all duration-300 ${collapsed ? "w-20" : "w-64"}`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className={`flex items-center ${collapsed ? "justify-center w-full" : ""}`}>
            {!collapsed && (
              <img src="https://i.postimg.cc/VNj3jq6w/1.png" alt="HearLink Logo" className="h-8 w-auto mr-3" />
            )}
            {!collapsed && <span className="text-xl font-bold text-hearlink-900">HearLink</span>}
            {collapsed && <img src="https://i.postimg.cc/VNj3jq6w/1.png" alt="HearLink" className="h-8 w-auto" />}
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
                <a href="/teacher-dashboard" className="flex items-center p-2 rounded-lg hover:bg-blue-50 text-gray-600">
                  <Home className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                  {!collapsed && <span>Dashboard</span>}
                </a>
              </li>
              <li>
                <a href="Classes" className="flex items-center p-2 rounded-lg hover:bg-blue-50 text-gray-600">
                  <Users className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                  {!collapsed && <span>Classes</span>}
                </a>
              </li>
              <li>
                <a href="Calendar" className="flex items-center p-2 rounded-lg hover:bg-blue-50 text-gray-600">
                  <Calendar className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                  {!collapsed && <span>Calendar</span>}
                </a>
              </li>
              <li>
                <a href="/teacher-materials" className="flex items-center p-2 rounded-lg hover:bg-blue-50 text-gray-600">
                  <BookOpen className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                  {!collapsed && <span>Materials</span>}
                </a>
              </li>
              <li>
                <a href="/teacher-analytics" className="flex items-center p-2 rounded-lg hover:bg-blue-50 text-blue-700 bg-blue-50 font-medium">
                  <BarChart className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                  {!collapsed && <span>Analytics</span>}
                </a>
              </li>
              <li>
                <a href="/emotion_analysis" className="flex items-center p-2 rounded-lg hover:bg-blue-50 text-gray-600">
                  <MessageSquare className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                  {!collapsed && <span>Emotion Analysis</span>}
                </a>
              </li>
              <li>
                <a href="/Classrecording" className="flex items-center p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
                  <Mic className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                  {!collapsed && <span>Record Classes</span>}
                </a>
              </li>
            </ul>
            <div className="border-t border-gray-200 mt-6 pt-6">
              <ul className="space-y-2">
                <li>
                  <a href="#" className="flex items-center p-2 rounded-lg hover:bg-blue-50 text-gray-600">
                    <Settings className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                    {!collapsed && <span>Settings</span>}
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center p-2 rounded-lg hover:bg-red-50 text-red-600">
                    <LogOut className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                    {!collapsed && <span>Logout</span>}
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between">
            <button
                onClick={toggleSidebar}
                className="p-1 rounded-full hover:bg-gray-200 lg:hidden"
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
                    d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-900 mr-4">Student Emotional Analysis</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search students..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center">
              <button className="p-2 rounded-full hover:bg-gray-100 relative">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 bg-red-500 rounded-full w-2 h-2"></span>
              </button>
              <div className="ml-4 flex items-center">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                  DL
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Prof. David Lee</p>
                  <p className="text-xs text-gray-500">Physics Teacher</p>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
            {/* Student Emotion Check Section */}
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="p-4 border-b border-gray-200 bg-blue-50">
                <h2 className="text-lg font-semibold text-blue-800">Student Emotional Status Monitor</h2>
                <p className="text-sm text-blue-600">Select a student to view detailed emotional analysis and get personalized teaching recommendations</p>
              </div>

              <div className="p-4">
                <div className="flex flex-wrap items-center justify-between mb-4 bg-blue-50 p-3 rounded-lg">
                  <div className="flex space-x-6">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm text-gray-700">
                      Positive ({positiveStudents.length})
                    </span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                      <span className="text-sm text-gray-700">
                      Distressed ({distressedStudents.length})
                    </span>
                    </div>
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Check All Students
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {students.map(student => (
                      <div
                          key={student.id}
                          className={`border rounded-lg p-4 bg-white hover:shadow-md transition-all ${
                              selectedStudent?.id === student.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                              {student.initials}
                            </div>
                            <div className="ml-3">
                              <div className="font-medium">{student.name}</div>
                              <div className="text-xs text-gray-500">{student.studentId}</div>
                            </div>
                          </div>
                          <div className={`h-5 w-5 rounded-full ${getStatusColor(student.status)} flex items-center justify-center text-white`}>
                            {getStatusIcon(student.status)}
                          </div>
                        </div>

                        <div className="text-sm mb-3">
                          <div className="mb-1">
                            <span className="font-medium">Top Emotion:</span>{" "}
                            <span className="capitalize">{student.status}</span>
                          </div>
                          <div>
                            <span className="font-medium">Distress Level:</span>{" "}
                            {student.distressPercentage}%
                          </div>
                          {student.alertTriggered && (
                              <div className="mt-1 text-red-600 text-xs flex items-center">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Alert Triggered
                              </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center">
                          {/* Last Checked Timestamp */}
                          {student.timestamp && (
                              <div className="text-xs text-gray-400 mt-3">
                                Last Active: {
                                (() => {
                                  const date = new Date(student.timestamp);
                                  const options = { timeZone: 'Asia/Kolkata' };
                                  const indiaDate = new Date(date.toLocaleString('en-US', options));

                                  const day = indiaDate.getDate();
                                  const month = indiaDate.toLocaleString('en-IN', { month: 'long' });
                                  const year = indiaDate.getFullYear().toString().slice(-2); // last two digits
                                  const hours = indiaDate.getHours();
                                  const minutes = indiaDate.getMinutes().toString().padStart(2, '0');
                                  const ampm = hours >= 12 ? 'PM' : 'AM';
                                  const hour12 = hours % 12 || 12;

                                  return `${day} ${month} '${year}, ${hour12}:${minutes} ${ampm}`;
                                })()
                              }
                              </div>

                          )}
                          <button
                              onClick={() => handleCheckStudent(student)}
                              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                  selectedStudent?.id === student.id
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                          >
                            {selectedStudent?.id === student.id ? 'Selected' : 'Check'}
                          </button>

                        </div>

                      </div>
                  ))}

                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && selectedStudent && (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Analyzing {selectedStudent.name}'s emotional data...</p>
                </div>
            )}

            {/* Student Analysis and Recommendations */}
            {selectedStudent && reportGenerated && !loading && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Detailed Analysis Report</h2>
                    <div className="text-sm text-gray-500">
                      Last updated: {new Date(selectedStudent.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Student Info */}
                    <div className="lg:col-span-1">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center mb-4">
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-lg">
                            {selectedStudent.initials}
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-lg">{selectedStudent.name}</div>
                            <div className="text-sm text-gray-500">{selectedStudent.studentId} • {selectedStudent.grade}</div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Primary Emotion:</span>
                            <span className={`text-sm font-medium capitalize px-2 py-1 rounded ${
                                selectedStudent.status === 'happy' ? 'bg-green-100 text-green-800' :
                                    selectedStudent.status === 'sad' ? 'bg-red-100 text-red-800' :
                                        selectedStudent.status === 'angry' ? 'bg-orange-100 text-orange-800' :
                                            'bg-gray-100 text-gray-800'
                            }`}>
                          {selectedStudent.status}
                        </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Distress Level:</span>
                            <span className={`text-sm font-medium ${
                                selectedStudent.distressPercentage > 50 ? 'text-red-600' :
                                    selectedStudent.distressPercentage > 25 ? 'text-yellow-600' :
                                        'text-green-600'
                            }`}>
                          {selectedStudent.distressPercentage}%
                        </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Frames:</span>
                            <span className="text-sm font-medium">{selectedStudent.totalFrames}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Chart and Emotions */}
                    <div className="lg:col-span-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Emotion Chart */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold mb-3">Emotion Distribution</h3>
                          {selectedStudent.chartImageBase64 ? (
                              <div className="flex justify-center">
                                <img
                                    src={`data:image/png;base64,${selectedStudent.chartImageBase64}`}
                                    alt="Emotion Distribution Chart"
                                    className="rounded shadow-md max-w-full h-auto"
                                    onLoad={() => {
                                      console.log("Image loaded successfully");
                                    }}
                                    onError={(e) => {
                                      console.error("Image failed to load. Base64 length:", selectedStudent.chartImageBase64?.length);
                                      console.error("Base64 starts with:", selectedStudent.chartImageBase64?.substring(0, 100));
                                      // Show fallback content instead of hiding
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                <div className="hidden items-center justify-center h-48 bg-gray-200 rounded">
                                  <div className="text-center">
                                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                    <span className="text-gray-500">Chart failed to load</span>
                                    <div className="text-xs text-gray-400 mt-1">
                                      Base64 length: {selectedStudent.chartImageBase64?.length || 0}
                                    </div>
                                  </div>
                                </div>
                              </div>
                          ) : (
                              <div className="flex items-center justify-center h-48 bg-gray-200 rounded">
                                <span className="text-gray-500">No chart available</span>
                              </div>
                          )}
                        </div>

                        {/* Emotion Breakdown */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold mb-3">Emotion Breakdown</h3>
                          <div className="space-y-2">
                            {selectedStudent.emotionsDistribution.map((emotion, index) => (
                                <div key={index} className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div
                                        className="h-3 w-3 rounded-full mr-2"
                                        style={{ backgroundColor: emotion.color }}
                                    ></div>
                                    <span className="text-sm">{emotion.name}</span>
                                  </div>
                                  <span className="text-sm font-medium">{emotion.value}%</span>
                                </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-semibold mb-2 text-blue-800">Recommendations</h3>
                      <ul className="text-sm text-blue-700 space-y-1">
                        {selectedStudent.distressPercentage > 50 ? (
                            <>
                              <li>• Consider one-on-one check-in</li>
                              <li>• Provide additional support resources</li>
                              <li>• Monitor closely in upcoming classes</li>
                            </>
                        ) : (
                            <>
                              <li>• Continue current teaching approach</li>
                              <li>• Encourage participation</li>
                              <li>• Provide positive reinforcement</li>
                            </>
                        )}
                      </ul>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="font-semibold mb-2 text-green-800">Positive Indicators</h3>
                      <ul className="text-sm text-green-700 space-y-1">
                        {selectedStudent.status === 'happy' ? (
                            <>
                              <li>• Shows positive engagement</li>
                              <li>• Appears comfortable in class</li>
                              <li>• Good emotional state</li>
                            </>
                        ) : (
                            <>
                              <li>• Attending class regularly</li>
                              <li>• Showing up for learning</li>
                              <li>• Responsive to instruction</li>
                            </>
                        )}
                      </ul>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h3 className="font-semibold mb-2 text-yellow-800">Areas to Watch</h3>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {selectedStudent.alertTriggered ? (
                            <>
                              <li>• High distress levels detected</li>
                              <li>• May need additional support</li>
                              <li>• Consider counseling referral</li>
                            </>
                        ) : (
                            <>
                              <li>• Monitor engagement levels</li>
                              <li>• Watch for changes in behavior</li>
                              <li>• Maintain supportive environment</li>
                            </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default TeacherAnalytics;