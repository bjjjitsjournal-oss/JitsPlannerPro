import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../hooks/use-toast';
import { apiRequest } from '../lib/queryClient';

export default function MyVideos() {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'technique',
    tags: '',
    videoUrl: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Since we don't have actual video upload functionality yet,
  // we'll allow users to add video URLs (YouTube, etc.)
  const createVideoMutation = useMutation({
    mutationFn: async (videoData: any) => {
      return await apiRequest("POST", "/api/training-videos", videoData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/training-videos'] });
      setShowUploadForm(false);
      setFormData({
        title: '',
        description: '',
        category: 'technique',
        tags: '',
        videoUrl: ''
      });
      toast({
        title: "Success",
        description: "Video added successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to add video",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.videoUrl.trim()) {
      toast({
        title: "Error",
        description: "Please provide both title and video URL",
        variant: "destructive",
      });
      return;
    }

    const videoData = {
      title: formData.title,
      description: formData.description || '',
      videoUrl: formData.videoUrl,
      category: formData.category,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
      uploadedBy: 1, // This would be the current user ID
      isPublic: 1
    };

    createVideoMutation.mutate(videoData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-black">My Videos</h1>
        <button
          onClick={() => setShowUploadForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Add Video
        </button>
      </div>

      {showUploadForm && (
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">Add Training Video</h2>
            <button
              onClick={() => setShowUploadForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter video title"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Video URL *
              </label>
              <input
                type="url"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleInputChange}
                placeholder="https://youtube.com/watch?v=... or other video URL"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              >
                <option value="technique">Technique</option>
                <option value="drilling">Drilling</option>
                <option value="sparring">Sparring</option>
                <option value="competition">Competition</option>
                <option value="tutorial">Tutorial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the video content..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="guard, submission, bjj"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={createVideoMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
              >
                {createVideoMutation.isPending ? 'Adding...' : 'Add Video'}
              </button>
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-black mb-4">Your Training Videos</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No videos uploaded yet.</p>
          <p className="text-sm">Click "Add Video" to share your training footage!</p>
        </div>
      </div>
    </div>
  );
}