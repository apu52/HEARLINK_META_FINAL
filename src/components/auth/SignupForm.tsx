import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Camera, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SignupFormProps {
  userType: "student" | "teacher";
}

const BASE_URL = import.meta.env.VITE_BASE_URL;
const SignupForm = ({ userType }: SignupFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [institution, setInstitution] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  // @ts-ignore
  const [userData, setUserData] = useState<UserData | null>(null);

  // Face verification states (only for students)
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [faceImageFile, setFaceImageFile] = useState<File | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.username = "Username is required";
    if (!email.trim()) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";
    if (password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    // Face verification validation for students only
    if (userType === "student" && !faceImage) {
      newErrors.faceImage = "Face verification photo is required for students";
    }

    // Institution validation for teachers
    if (userType === "teacher" && !institution.trim()) {
      newErrors.institution = "Institution is required for teachers";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Convert data URL to File object
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Camera functions for face verification
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30 }
        }
      });
      setStream(mediaStream);
      setShowCamera(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (error) {
      console.error("Error accessing camera:", error);
      setErrors({ ...errors, faceImage: "Unable to access camera. Please try uploading a photo instead." });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      if (context && video.readyState === 4) {
        context.filter = 'brightness(1.1) contrast(1.1) saturate(1.1)';
        context.scale(-1, 1);
        context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);

        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setFaceImage(imageData);

        // Convert to File for upload
        const file = dataURLtoFile(imageData, `face-${name}-${Date.now()}.jpg`);
        setFaceImageFile(file);

        stopCamera();
        setErrors({ ...errors, faceImage: "" });
      } else {
        setErrors({ ...errors, faceImage: "Camera not ready. Please try again." });
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, faceImage: "Please upload a valid image file" });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, faceImage: "Image size should be less than 5MB" });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFaceImage(result);
        setFaceImageFile(file);
        setErrors({ ...errors, faceImage: "" });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFaceImage = () => {
    setFaceImage(null);
    setFaceImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData for multipart/form-data
      const formData = new FormData();
      formData.append("username", name);
      formData.append("email", email);
      formData.append("password", password);

      // Add institution for teachers
      if (userType === "teacher") {
        formData.append("institution", institution);
      }

      // Add face image for students
      if (userType === "student" && faceImageFile) {
        formData.append("face_image", faceImageFile);
      }

      const response = await fetch(`${BASE_URL}/api/register`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (data.error.includes('Username already exists')) {
          setErrors({ username: data.error });
        } else if (data.error.includes('Email already exists')) {
          setErrors({ email: data.error });
        } else if (data.error.includes('face image')) {
          setErrors({ faceImage: data.error });
        } else {
          setErrors({ general: data.error || "Registration failed" });
        }
      } else {
        // Registration successful
        setRegistrationSuccess(true);
        setUserData(data.user);

        // Store user data in component state (since localStorage is not available)
        // In a real application, you would store this in localStorage or a state management solution
        console.log("Registration successful:", data);

        // Clear form
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setInstitution("");
        setFaceImage(null);
        setFaceImageFile(null);
        setErrors({});
      }
    } catch (error) {
      console.error("Signup error:", error);
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };
  if (registrationSuccess && userData) {
    return (
        <div className="max-w-md mx-auto mt-8">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 border-2 border-green-200 shadow-lg text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Registration Successful!</h2>
            <p className="text-green-700 mb-4">
              Thank you, {userData.username}! Your {userType} account has been created successfully.You can now Log In!
            </p>
            <div className="bg-white rounded-lg p-4 mb-4 text-left">
              <h3 className="font-semibold text-gray-700 mb-2">Account Details:</h3>
              <p className="text-sm text-gray-600">User ID: {userData.user_id}</p>
              <p className="text-sm text-gray-600">Username: {userData.username}</p>
              <p className="text-sm text-gray-600">Email: {userData.email}</p>
            </div>
            <Button
                onClick={() => {
                  setRegistrationSuccess(false);
                  setUserData(null);
                }}
                className="bg-green-600 hover:bg-green-700"
            >
              Create Another Account
            </Button>
          </div>
        </div>
    );
  }

  return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
              id="username"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-2 border ${
                  errors.username ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-2 focus:ring-hearlink-500 focus:border-hearlink-500`}
              placeholder="Enter your username"
              required
          />
          {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2 border ${
                  errors.email ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-2 focus:ring-hearlink-500 focus:border-hearlink-500`}
              placeholder="Enter your email"
              required
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-2 border ${
                    errors.password ? "border-red-500" : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-2 focus:ring-hearlink-500 focus:border-hearlink-500`}
                placeholder="••••••••"
                required
            />
            <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          <p className="mt-1 text-xs text-gray-500">Password must be at least 8 characters long</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-2 border ${
                    errors.confirmPassword ? "border-red-500" : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-2 focus:ring-hearlink-500 focus:border-hearlink-500`}
                placeholder="••••••••"
                required
            />
            <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Face Verification Section - Only for Students */}
        {userType === "student" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Face Verification Photo *
            </label>
            
            {!faceImage && !showCamera && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-dashed border-blue-300">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Camera className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Face Verification Required</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      We need to verify your identity with a clear photo of your face
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        type="button"
                        onClick={startCamera}
                        className="flex items-center justify-center space-x-2 bg-hearlink-600 hover:bg-hearlink-700 px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
                      >
                        <Camera className="h-5 w-5" />
                        <span className="font-medium">Take Photo</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
                      >
                        <Upload className="h-5 w-5" />
                        <span className="font-medium">Upload Photo</span>
                      </Button>
                    </div>
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-yellow-800" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-yellow-800 font-medium">Photo Guidelines</p>
                      <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                        <li>• Face should be clearly visible and well-lit</li>
                        <li>• Look directly at the camera</li>
                        <li>• Remove sunglasses or face coverings</li>
                        <li>• Works even in dim lighting conditions</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showCamera && (
              <div className="space-y-4">
                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 shadow-2xl">
                  {/* Camera Preview with Overlay */}
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full max-w-md rounded-xl border-4 border-white/20 shadow-lg mx-auto block"
                      style={{ transform: 'scaleX(-1)', aspectRatio: '4/3' }}
                    />
                    
                    {/* Face Detection Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-4 border-2 border-hearlink-400 rounded-full opacity-30"></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-56 border-2 border-hearlink-400 rounded-full animate-pulse"></div>
                    </div>
                    
                    {/* Corner Guides */}
                    <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-hearlink-400 rounded-tl-lg"></div>
                    <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-hearlink-400 rounded-tr-lg"></div>
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-hearlink-400 rounded-bl-lg"></div>
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-hearlink-400 rounded-br-lg"></div>
                  </div>
                  
                  <canvas ref={canvasRef} className="hidden" />
                  
                  <div className="text-center mt-4">
                    <p className="text-white text-sm font-medium">Position your face within the oval</p>
                    <p className="text-gray-300 text-xs mt-1">Make sure your face is well-lit and clearly visible</p>
                  </div>
                </div>
                
                <div className="flex space-x-3 justify-center">
                  <Button
                    type="button"
                    onClick={capturePhoto}
                    className="flex items-center space-x-2 bg-hearlink-600 hover:bg-hearlink-700 px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <Camera className="h-5 w-5" />
                    <span className="font-medium">Capture Photo</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={stopCamera}
                    className="px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {faceImage && (
              <div className="space-y-4">
                <div className="relative bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 border-2 border-green-200 shadow-lg">
                  <div className="relative inline-block mx-auto">
                    <div className="relative">
                      <img
                        src={faceImage}
                        alt="Face verification"
                        className="w-40 h-40 object-cover rounded-2xl border-4 border-white shadow-lg mx-auto block"
                      />
                      
                      {/* Success Overlay */}
                      <div className="absolute inset-0 bg-green-500/10 rounded-2xl"></div>
                      
                      {/* Checkmark */}
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-2 shadow-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      
                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={removeFaceImage}
                        className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg transition-all duration-200 transform hover:scale-110"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-center mt-4">
                    <p className="text-green-700 font-semibold">✓ Face verification photo captured!</p>
                    <p className="text-gray-600 text-sm mt-1">Your photo looks great and is ready for verification</p>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFaceImage(null)}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Take Another Photo</span>
                  </Button>
                </div>
              </div>
            )}
            
            {errors.faceImage && (
              <p className="mt-1 text-sm text-red-600">{errors.faceImage}</p>
            )}
          </div>
        )}

        {userType === "teacher" && (
            <div>
              <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-1">
                Institution
              </label>
              <input
                  id="institution"
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-hearlink-500 focus:border-hearlink-500"
                  placeholder="University/School Name"
              />
            </div>
        )}

        <div className="flex items-center">
          <input
              id="terms"
              name="terms"
              type="checkbox"
              className="h-4 w-4 text-hearlink-600 focus:ring-hearlink-500 border-gray-300 rounded"
              required
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
            I agree to the{" "}
            <a href="/terms" className="text-hearlink-600 hover:text-hearlink-700">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-hearlink-600 hover:text-hearlink-700">
              Privacy Policy
            </a>
          </label>
        </div>

        <Button
            type="submit"
            className="w-full bg-hearlink-600 hover:bg-hearlink-700"
            disabled={isLoading}
        >
          {isLoading ? "Creating account..." : "Sign up"}
        </Button>
      </form>
  );
};

export default SignupForm;