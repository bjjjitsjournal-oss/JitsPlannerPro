import React, { useState, useRef } from 'react';
import { Upload, Video, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';

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

  const uploadMutation = useMutation({
    mutationFn: async ({ videoDataUrl, fileName, thumbnail }: {
      videoDataUrl: string;
      fileName: string;
      thumbnail?: string;
    }) => {
      // Update progress to show upload starting
      setUploadProgress(70);
      
      const response = await apiRequest("POST", `/api/notes/${noteId}/upload-video`, {
        videoDataUrl,
        fileName,
        thumbnail,
        userId: user?.id
      });
      
      // Simulate upload progress completion
      setUploadProgress(100);
      
      return response;
    },
    onSuccess: () => {
      // Keep progress at 100% briefly before clearing
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
      
      queryClient.invalidateQueries({ queryKey: ['notes'] });
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
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/notes/${noteId}/video`, {
        userId: user?.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
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
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Video must be less than 50MB",
        variant: "destructive",
      });
      return;
    }

    uploadVideo(file);
  };

  const uploadVideo = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Show initial processing message
      toast({
        title: "Processing video...",
        description: "Preparing your video for upload",
      });

      // Convert file to data URL with better progress tracking
      const reader = new FileReader();
      
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          // FileReader progress represents file reading (0-50%)
          const readProgress = (e.loaded / e.total) * 50;
          setUploadProgress(readProgress);
        }
      };

      reader.onload = async (e) => {
        const videoDataUrl = e.target?.result as string;
        
        // Update progress to show file reading is complete
        setUploadProgress(50);
        
        // Generate thumbnail (optional)
        const thumbnail = await generateThumbnail(file);
        
        // Update progress for thumbnail generation
        setUploadProgress(60);
        
        // Start actual upload
        uploadMutation.mutate({
          videoDataUrl,
          fileName: file.name,
          thumbnail
        });
      };

      reader.onerror = () => {
        throw new Error('Failed to read file');
      };

      reader.readAsDataURL(file);
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

  return (
    <div className="mt-4">
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
        Supported formats: MP4, MOV, AVI • Maximum file size: 50MB
      </p>
    </div>
  );
}