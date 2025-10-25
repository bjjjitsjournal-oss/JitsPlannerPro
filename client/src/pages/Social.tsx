import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../hooks/use-toast';
import { apiRequest } from '../lib/queryClient';
import { useAuth } from '../contexts/AuthContext';
import { Users, UserPlus, Share2, MessageCircle, Heart, Eye, Trash2 } from 'lucide-react';

export default function Social() {
  const [activeTab, setActiveTab] = useState<'community' | 'friends' | 'invite' | 'my-gym'>('community');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch user's gym membership
  const { data: gymMembership } = useQuery({
    queryKey: ['/api/my-gym'],
    staleTime: 60000, // Cache for 1 minute
  });

  // Fetch shared notes from the community
  const { data: sharedNotes = [], isLoading: notesLoading } = useQuery<any[]>({
    queryKey: ['/api/notes/shared'],
    staleTime: 30000, // Cache for 30 seconds (more dynamic content)
  });

  // Fetch gym notes
  const { data: gymNotes = [], isLoading: gymNotesLoading } = useQuery<any[]>({
    queryKey: ['/api/gym-notes'],
    enabled: !!gymMembership,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Like/unlike mutation
  const likeMutation = useMutation({
    mutationFn: async ({ noteId, isLiked }: { noteId: number; isLiked: boolean }) => {
      if (isLiked) {
        return await apiRequest("DELETE", `/api/notes/${noteId}/like`);
      } else {
        return await apiRequest("POST", `/api/notes/${noteId}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes/shared'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    },
  });

  // Admin delete mutation for moderation
  const adminDeleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      return await apiRequest("DELETE", `/api/notes/${noteId}/admin`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes/shared'] });
      toast({
        title: "Note Removed",
        description: "The inappropriate note has been removed from the community.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to remove note",
        variant: "destructive",
      });
    },
  });

  // Check if current user is admin from database role
  const isAdmin = user?.role === 'admin';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Social</h1>
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          <span className="text-sm text-gray-600">Connect with training partners</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        <button
          onClick={() => setActiveTab('community')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'community'
              ? 'bg-white text-black shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          data-testid="tab-community"
        >
          Community
        </button>
        {gymMembership && (
          <button
            onClick={() => setActiveTab('my-gym')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'my-gym'
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="tab-my-gym"
          >
            My Gym
          </button>
        )}
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'friends'
              ? 'bg-white text-black shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          data-testid="tab-friends"
        >
          Friends
        </button>
      </div>

      {/* Community Tab */}
      {activeTab === 'community' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Community Shared Notes
            </h2>
            
            {notesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading community notes...</p>
              </div>
            ) : sharedNotes.length > 0 ? (
              <div className="space-y-4">
                {sharedNotes.map((note: any) => (
                  <div key={note.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="space-y-3">
                      {/* Header with title and author */}
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-black">{note.title}</h3>
                        <div className="text-xs text-gray-500">
                          by {note.author ? `${note.author.firstName} ${note.author.lastName}` : 'Unknown User'}
                        </div>
                      </div>
                      
                      {/* Full-width content */}
                      <div className="w-full">
                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap break-words">{note.content}</p>
                      </div>
                      
                      {/* Video Display for Shared Notes */}
                      {note.videoUrl && (
                        <div className="mt-3">
                          <video 
                            controls 
                            className="w-full max-w-md rounded-lg shadow-sm"
                            style={{ maxHeight: '300px' }}
                          >
                            <source src={note.videoUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                          {note.videoFileName && (
                            <p className="text-xs text-gray-500 mt-1">📹 {note.videoFileName}</p>
                          )}
                        </div>
                      )}
                      
                      {/* Tags */}
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {note.tags.map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Footer with date and actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-400">
                          Shared {new Date(note.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-3 text-gray-500 text-sm">
                          <button 
                            onClick={() => likeMutation.mutate({ 
                              noteId: note.id, 
                              isLiked: note.isLikedByUser || false 
                            })}
                            disabled={likeMutation.isPending}
                            className={`flex items-center gap-1 transition-colors ${
                              note.isLikedByUser 
                                ? 'text-red-500 hover:text-red-600' 
                                : 'hover:text-red-500'
                            }`}
                          >
                            <Heart 
                              className={`w-4 h-4 ${
                                note.isLikedByUser ? 'fill-current' : ''
                              }`} 
                            />
                            <span>{note.likeCount || 0}</span>
                          </button>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>0</span>
                          </div>
                          {/* Admin delete button for moderation */}
                          {isAdmin && (
                            <button 
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
                                  adminDeleteMutation.mutate(note.id);
                                }
                              }}
                              disabled={adminDeleteMutation.isPending}
                              className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors"
                              title="Remove inappropriate content"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="text-xs">Remove</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No shared notes yet.</p>
                <p className="text-sm">Be the first to share your knowledge with the community!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Gym Tab */}
      {activeTab === 'my-gym' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              {gymMembership?.name || 'My Gym'} - Shared Notes
            </h2>
            
            {gymNotesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading gym notes...</p>
              </div>
            ) : gymNotes.length > 0 ? (
              <div className="space-y-4">
                {gymNotes.map((note: any) => (
                  <div key={note.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="space-y-3">
                      {/* Header with title and author */}
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-black">{note.title}</h3>
                        <div className="text-xs text-gray-500">
                          by {note.author ? `${note.author.firstName} ${note.author.lastName}` : 'Unknown User'}
                        </div>
                      </div>
                      
                      {/* Full-width content */}
                      <div className="w-full">
                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap break-words">{note.content}</p>
                      </div>
                      
                      {/* Video Display for Gym Notes */}
                      {note.videoUrl && (
                        <div className="mt-3">
                          <video 
                            controls 
                            className="w-full max-w-md rounded-lg shadow-sm"
                            style={{ maxHeight: '300px' }}
                          >
                            <source src={note.videoUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                          {note.videoFileName && (
                            <p className="text-xs text-gray-500 mt-1">📹 {note.videoFileName}</p>
                          )}
                        </div>
                      )}
                      
                      {/* Tags */}
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {note.tags.map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Footer with date */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-400">
                          Shared {new Date(note.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No gym notes yet.</p>
                <p className="text-sm">Share your first note with your gym community!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Training Partners
            </h2>
            
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No training partners connected yet.</p>
              <p className="text-sm">Invite your training partners to start sharing notes and progress!</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Find Training Partners</h3>
            <div className="text-center py-6 text-gray-500">
              <p>Feature coming soon!</p>
              <p className="text-sm">Soon you'll be able to find training partners near you.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}