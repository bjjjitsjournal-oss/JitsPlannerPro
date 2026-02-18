import React, { useState, useRef } from 'react';
import { Upload, Video, Trash2, AlertTriangle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Capacitor } from '@capacitor/core';

// Get API base URL - use Render for mobile, env var for web
const API_BASE_URL = Capacitor.isNativePlatform() 
  ? 'https://jitsjournal-backend.onrender.com'
  : (import.meta.env.VITE_API_BASE_URL || '');

interface StorageUsageData {
  storageUsed: number;
  storageUsedFormatted: string;
  quota: number;
  quotaFormatted: string;
  remaining: number;
  remainingFormatted: string;
  percentage: number;
  tier: string;
  tierName: string;
}

interface VideoUploadProps {
  noteId: string;
  existingVideo?: {
    videoUrl: string;
    videoFileName: string;
    videoThumbnail?: string;
  } | null;
  onVideoUploaded?: () => void;
}

export default function VideoUpload({ noteId, existingVideo, onVideoUploaded }: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch storage usage
  const { data: storageData } = useQuery<StorageUsageData>({
    queryKey: ["/api/storage/usage"],
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, thumbnail }: {
      file: File;
      thumbnail?: string;
    }) => {
      // Create FormData to send file to backend
      const formData = new FormData();
      formData.append('video', file);
      formData.append('fileName', file.name);
      formData.append('fileSize', file.size.toString());
      formData.append('userId', user?.id?.toString() || '');
      formData.append('supabaseId', user?.supabaseId || '');
      if (thumbnail) {
        formData.append('thumbnail', thumbnail);
      }
      
      // Debug logging for mobile
      console.log('📤 FormData being sent:');
      console.log('  - userId:', user?.id);
      console.log('  - supabaseId:', user?.supabaseId);
      console.log('  - fileName:', file.name);
      console.log('  - fileSize:', file.size);
      
      // Upload to backend (which will use R2)
      setUploadProgress(30);
      const uploadUrl = `${API_BASE_URL}/api/notes/${noteId}/upload-video`;
      console.log('🎥 Starting video upload to:', uploadUrl);
      console.log('📦 File size:', file.size, 'bytes');
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      }).catch((fetchError) => {
        console.error('❌ Fetch error:', fetchError);
        throw new Error(`Network error: ${fetchError.message}`);
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Server error:', error);
        throw new Error(error.message || 'Upload failed');
      }
      
      setUploadProgress(80);
      const result = await response.json();
      setUploadProgress(100);
      return result;
    },
    onSuccess: () => {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
      
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/storage/usage'] });
      toast({
        title: "Video uploaded successfully!",
        description: "Your video has been attached to the note",
      });
      onVideoUploaded?.();
    },
    onError: (error: any) => {
      setIsUploading(false);
      setUploadProgress(0);
      console.error('Video upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/notes/${noteId}/video?userId=${user?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/storage/usage'] });
      toast({
        title: "Video removed",
        description: "Video has been removed from the note",
      });
      onVideoUploaded?.();
    },
    onError: (error: any) => {
      toast({
        title: "Remove failed",
        description: "Failed to remove video. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a video file",
          variant: "destructive",
        });
        return;
      }

      const maxSize = 1 * 1024 * 1024 * 1024; // 1GB
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Video must be less than 1GB",
          variant: "destructive",
        });
        return;
      }

      if (storageData) {
        const fileSizeInBytes = file.size;
        const remainingBytes = storageData.remaining;

        if (fileSizeInBytes > remainingBytes) {
          const fileSizeMB = (fileSizeInBytes / (1024 * 1024)).toFixed(1);
          toast({
            title: "Storage quota exceeded",
            description: `This video (${fileSizeMB} MB) exceeds your remaining storage (${storageData.remainingFormatted}). Delete videos or upgrade your plan.`,
            variant: "destructive",
          });
          return;
        }
      }

      uploadVideo(file);
    } catch (error) {
      console.error('Error selecting video file:', error);
      toast({
        title: "Error",
        description: "Could not access video. Please check your camera and photo library permissions in Settings.",
        variant: "destructive",
      });
    }
  };

  const uploadVideo = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Generate thumbnail (optional)
      const thumbnail = await generateThumbnail(file);
      
      setUploadProgress(20);
      
      // Start upload to Supabase Storage
      uploadMutation.mutate({
        file,
        thumbnail
      });
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setUploadProgress(0);
      toast({
        title: "Upload failed",
        description: "Failed to process video file",
        variant: "destructive",
      });
    }
  };

  const generateThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.onloadeddata = () => {
        video.currentTime = 1; // Seek to 1 second
      };
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx?.drawImage(video, 0, 0);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnail);
      };
      video.onerror = () => resolve(''); // Return empty string if thumbnail generation fails
      video.src = URL.createObjectURL(file);
    });
  };

  const handleRemoveVideo = () => {
    removeMutation.mutate();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (existingVideo) {
    return (
      <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-800">Attached Video</span>
          </div>
          <button
            onClick={handleRemoveVideo}
            disabled={removeMutation.isPending}
            className="text-red-600 hover:text-red-700 p-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        
        <div className="relative">
          <video
            ref={videoRef}
            src={existingVideo.videoUrl}
            controls
            className="w-full rounded-lg shadow-sm"
            style={{ maxHeight: '300px' }}
          >
            Your browser does not support the video tag.
          </video>
          
          <div className="mt-2 text-sm text-gray-600">
            📎 {existingVideo.videoFileName}
          </div>
        </div>
      </div>
    );
  }

  const isNearLimit = storageData && storageData.percentage >= 80;
  const isFull = storageData && storageData.percentage >= 100;

  return (
    <div className="mt-4">
      {isNearLimit && !isFull && (
        <Alert className="mb-4" data-testid="alert-storage-warning-upload">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You're using {storageData?.percentage.toFixed(0)}% of your storage ({storageData?.remainingFormatted} remaining). 
            Consider deleting old videos or upgrading your plan.
          </AlertDescription>
        </Alert>
      )}

      {isFull && (
        <Alert variant="destructive" className="mb-4" data-testid="alert-storage-full-upload">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Storage limit reached. Delete videos or upgrade to continue uploading.
          </AlertDescription>
        </Alert>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {isUploading ? (
        <div className="p-6 border-2 border-blue-300 border-dashed rounded-lg bg-blue-50">
          <div className="text-center">
            <Video className="w-8 h-8 text-blue-600 mx-auto mb-3 animate-pulse" />
            <p className="text-blue-800 font-medium mb-2">
              {uploadProgress < 50 ? "Reading video file..." : 
               uploadProgress < 60 ? "Generating thumbnail..." : 
               uploadProgress < 100 ? "Uploading to server..." : "Finalizing..."}
            </p>
            <div className="w-full bg-blue-200 rounded-full h-3 mb-2">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-blue-600 font-medium">{Math.round(uploadProgress)}% complete</p>
            <p className="text-xs text-blue-500 mt-1">Please wait, do not close this page</p>
          </div>
        </div>
      ) : (
        <div className="w-full">
          <button
            onClick={triggerFileInput}
            className="w-full p-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
            disabled={isUploading}
          >
            <div className="text-center">
              <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mx-auto mb-3" />
              <span className="text-lg text-gray-600 group-hover:text-blue-600 font-medium">
                Upload Video from Gallery
              </span>
              <p className="text-sm text-gray-500 mt-2">Select a video file from your device</p>
            </div>
          </button>
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-3 text-center">
        Supported formats: MP4, MOV, AVI • Maximum file size: 1GB
      </p>
    </div>
  );
}