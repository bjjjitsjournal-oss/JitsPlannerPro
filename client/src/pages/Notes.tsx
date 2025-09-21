import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../hooks/use-toast';
import { apiRequest } from '../lib/queryClient';
import VideoUpload from '../components/VideoUpload';
import { useAuth } from '../contexts/AuthContext';
import { isPremiumUser, FREE_TIER_LIMITS } from '../utils/subscription';

export default function Notes() {
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Check if user has premium access
  const isPremium = isPremiumUser(user?.email, user?.subscriptionStatus);

  // Fetch notes from API
  const { data: notes = [], isLoading, refetch: refetchNotes } = useQuery<any[]>({
    queryKey: ['/api/notes'],
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Force refresh data when component mounts
  React.useEffect(() => {
    refetchNotes();
  }, [refetchNotes]);

  // Toggle note sharing mutation
  const toggleSharingMutation = useMutation({
    mutationFn: async (noteId: number) => {
      return await apiRequest("POST", `/api/notes/${noteId}/toggle-sharing`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      toast({
        title: "Success",
        description: "Note sharing updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: "Failed to update note sharing",
        variant: "destructive",
      });
    },
  });

  // Filter notes based on search query
  const filteredNotes = notes.filter(note => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const title = (note.title || '').toLowerCase();
    const content = (note.content || '').toLowerCase();
    const tags = Array.isArray(note.tags) ? note.tags.join(' ').toLowerCase() : '';
    
    return title.includes(query) || content.includes(query) || tags.includes(query);
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (noteData: any) => {
      return await apiRequest('POST', '/api/notes', noteData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      queryClient.refetchQueries({ queryKey: ['/api/notes'] });
      refetchNotes(); // Force immediate refresh
      toast({
        title: 'Note Saved!',
        description: 'Your technique note has been saved.',
      });
      setShowForm(false);
      setEditingNote(null);
      setFormData({
        title: '',
        content: '',
        tags: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: 'Failed to save note. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ noteId, noteData }: { noteId: number, noteData: any }) => {
      return await apiRequest('PUT', `/api/notes/${noteId}`, noteData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      queryClient.refetchQueries({ queryKey: ['/api/notes'] });
      refetchNotes();
      toast({
        title: 'Note Updated!',
        description: 'Your note has been updated successfully.',
      });
      setShowForm(false);
      setEditingNote(null);
      setFormData({
        title: '',
        content: '',
        tags: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: 'Failed to update note. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete note mutation  
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      return await apiRequest('DELETE', `/api/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      queryClient.refetchQueries({ queryKey: ['/api/notes'] });
      refetchNotes();
      toast({
        title: 'Note Deleted!',
        description: 'Your note has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: 'Failed to delete note. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't submit if already processing or title is empty
    if ((createNoteMutation.isPending || updateNoteMutation.isPending) || !formData.title.trim()) {
      return;
    }
    
    // Check note limit for free tier users (only for new notes, not edits)
    if (!editingNote && !isPremium && Array.isArray(notes) && notes.length >= FREE_TIER_LIMITS.notes) {
      toast({
        title: 'Note Limit Reached',
        description: `Free tier is limited to ${FREE_TIER_LIMITS.notes} notes. Upgrade to Premium for unlimited notes!`,
        variant: 'destructive',
      });
      return;
    }
    
    const noteData = {
      title: formData.title,
      content: formData.content || '', // Optional content
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [], // Optional tags
    };

    if (editingNote) {
      updateNoteMutation.mutate({ noteId: editingNote.id, noteData });
    } else {
      createNoteMutation.mutate(noteData);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle toggling note sharing
  const handleToggleSharing = async (noteId: number) => {
    try {
      await toggleSharingMutation.mutateAsync(noteId);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  // Handle editing a note
  const handleEditNote = (note: any) => {
    setEditingNote(note);
    setFormData({
      title: note.title || '',
      content: note.content || '',
      tags: Array.isArray(note.tags) ? note.tags.join(', ') : ''
    });
    setShowForm(true);
  };

  // Handle deleting a note
  const handleDeleteNote = (noteId: number) => {
    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingNote(null);
    setFormData({
      title: '',
      content: '',
      tags: ''
    });
  };

  if (showForm) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editingNote ? 'Edit Note' : 'New Note'}
          </h2>
          <button
            onClick={handleCancelEdit}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter note title"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
              Content
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={6}
              placeholder="Describe the technique, key points, setup, etc. (optional)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
              Tags (separated by commas)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="e.g., guard, armbar, fundamentals"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createNoteMutation.isPending || updateNoteMutation.isPending}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(createNoteMutation.isPending || updateNoteMutation.isPending) 
                ? 'Saving...' 
                : editingNote 
                  ? 'Update Note' 
                  : 'Save Note'
              }
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notes</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          + New Note
        </button>
      </div>

      {/* Subscription Notice - Only show for free tier users */}
      {!isPremium && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-600">⚠️</span>
            <span className="font-medium text-yellow-800">Free Tier Limit</span>
          </div>
          <p className="text-sm text-yellow-700">
            You have {Array.isArray(notes) ? notes.length : 0} out of {FREE_TIER_LIMITS.notes} free notes. Upgrade to Premium for unlimited notes and sharing!
          </p>
          <button className="mt-2 text-sm text-yellow-800 font-medium hover:text-yellow-900">
            Upgrade Now →
          </button>
        </div>
      )}
      
      {/* Premium Status - Show for premium users */}
      {isPremium && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-600">✓</span>
            <span className="font-medium text-green-800">Premium Access</span>
          </div>
          <p className="text-sm text-green-700">
            You have unlimited notes with sharing capabilities. Keep adding your knowledge!
          </p>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes by title, content, or tags..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-black"
        />
        {searchQuery && (
          <div className="mt-2 text-sm text-black">
            Found {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} matching "{searchQuery}"
          </div>
        )}
      </div>

      {/* Notes List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-4 rounded-xl shadow-md animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : Array.isArray(notes) && notes.length > 0 ? (
        filteredNotes.length > 0 ? (
          <div className="space-y-4">
            {filteredNotes.map((note: any) => (
              <div key={note.id} className="bg-white p-4 rounded-xl shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-black">{note.title}</h3>
                  <div className="flex items-center gap-2">
                    {note.isShared === 1 && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Shared
                      </span>
                    )}
                    <button
                      onClick={() => handleEditNote(note)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      title="Edit note"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                      title="Delete note"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleToggleSharing(note.id)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      {note.isShared === 1 ? 'Unshare' : 'Share'}
                    </button>
                  </div>
                </div>
                <p className="text-black text-sm mb-3">
                  {note.content}
                </p>
                
                {/* Video Upload Component */}
                <VideoUpload 
                  noteId={note.id}
                  existingVideo={note.videoUrl ? {
                    videoUrl: note.videoUrl,
                    videoFileName: note.videoFileName,
                    videoThumbnail: note.videoThumbnail
                  } : null}
                  onVideoUploaded={() => {
                    // Refresh the notes list when video is uploaded/removed
                    queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
                  }}
                />
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(note.tags) && note.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="text-xs bg-gray-100 text-black px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-black">
                    {new Date(note.createdAt || note.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-black">
            <p>No notes found matching "{searchQuery}"</p>
            <p className="text-sm">Try a different search term or clear the search.</p>
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Clear search
            </button>
          </div>
        )
      ) : (
        <div className="text-center py-8 text-black">
          <p>No notes yet.</p>
          <p className="text-sm">Create your first technique note!</p>
        </div>
      )}
    </div>
  );
}