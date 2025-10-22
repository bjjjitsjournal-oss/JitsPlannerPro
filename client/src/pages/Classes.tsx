import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../hooks/use-toast';
import { classesQueries } from '../lib/supabaseQueries';
import WeeklyGoals from '../components/WeeklyGoals';
import { useAuth } from '../contexts/AuthContext';
import { isPremiumUser, FREE_TIER_LIMITS } from '../utils/subscription';
import { ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react';

export default function Classes() {
  const [showForm, setShowForm] = useState(false);
  const [editingClassId, setEditingClassId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [classToDelete, setClassToDelete] = useState<number | null>(null);
  const [expandedClassId, setExpandedClassId] = useState<number | null>(null);
  
  // Helper function to get current date in Sydney, Australia timezone
  const getSydneyDate = () => {
    return new Intl.DateTimeFormat('en-CA', { 
      timeZone: 'Australia/Sydney', 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).format(new Date());
  };

  const [formData, setFormData] = useState({
    date: getSydneyDate(),
    time: '18:00', // Default to 6:00 PM
    duration: 60,
    type: 'Gi',
    instructor: '',
    notes: '',
    // Rolling tracking fields
    rollingPartners: '',
    yourSubmissions: 0,
    partnerSubmissions: 0,
    cardioRating: 3
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Check if user has premium access
  const isPremium = isPremiumUser(user?.email, user?.subscriptionStatus);

  // Fetch classes from Supabase
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['classes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await classesQueries.getAll(user.id);
    },
    enabled: !!user?.id,
  });

  // Ensure classes is always an array
  const classesArray = Array.isArray(classes) ? classes : [];

  // Create class mutation with context for summary
  const createClassMutation = useMutation({
    mutationFn: async ({ classData, originalFormData }: { classData: any, originalFormData: any }) => {
      if (!user?.id) throw new Error('User not authenticated');
      const result = await classesQueries.create(user.id, classData);
      return { result, originalFormData };
    },
    onSuccess: ({ originalFormData }) => {
      // Invalidate all related queries to refresh dashboard data
      queryClient.invalidateQueries({ queryKey: ['classes', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['weekly-commitment', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['current-belt', user?.id] });
      
      // Also force refetch to ensure immediate updates
      queryClient.refetchQueries({ queryKey: ['classes', user?.id] });
      queryClient.refetchQueries({ queryKey: ['weekly-commitment', user?.id] });
      
      // Create brief summary for toast using original form data
      let description = 'Your training session has been recorded.';
      const details = [];
      
      if (originalFormData.instructor && originalFormData.instructor.trim()) {
        details.push(`with ${originalFormData.instructor}`);
      }
      
      if (originalFormData.notes && originalFormData.notes.trim()) {
        // Take first 30 characters of notes for brief
        const briefNotes = originalFormData.notes.trim().length > 30 
          ? originalFormData.notes.trim().substring(0, 30) + '...'
          : originalFormData.notes.trim();
        details.push(briefNotes);
      }
      
      if (details.length > 0) {
        description = `${originalFormData.type} class logged - ${details.join(' • ')}`;
      }
      
      toast({
        title: 'Class Logged!',
        description: description,
        duration: 4000, // Show longer to read the details
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: 'Failed to log class. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Update class mutation
  const updateClassMutation = useMutation({
    mutationFn: async ({ classId, classData }: { classId: number, classData: any }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return await classesQueries.update(classId, user.id, classData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', user?.id] });
      toast({
        title: 'Class Updated!',
        description: 'Your class has been updated successfully.',
        duration: 4000,
      });
      resetForm();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update class. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete class mutation
  const deleteClassMutation = useMutation({
    mutationFn: async (classId: number) => {
      if (!user?.id) throw new Error('User not authenticated');
      return await classesQueries.delete(classId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['weekly-commitment', user?.id] });
      toast({
        title: 'Class Deleted',
        description: 'Your class has been removed.',
        duration: 4000,
      });
      setShowDeleteDialog(false);
      setClassToDelete(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete class. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingClassId(null);
    setFormData({
      date: getSydneyDate(),
      time: '18:00',
      duration: 60,
      type: 'Gi',
      instructor: '',
      notes: '',
      rollingPartners: '',
      yourSubmissions: 0,
      partnerSubmissions: 0,
      cardioRating: 3
    });
  };

  const handleEdit = (classItem: any) => {
    setEditingClassId(classItem.id);
    setFormData({
      date: classItem.date.split('T')[0], // Extract date from ISO string
      time: classItem.time || '18:00',
      duration: classItem.duration,
      type: classItem.classType || classItem.class_type,
      instructor: classItem.instructor || '',
      notes: classItem.techniquesFocused || classItem.techniques_focused || '',
      rollingPartners: classItem.rollingPartners?.join(', ') || classItem.rolling_partners?.join(', ') || '',
      yourSubmissions: classItem.yourSubmissions || classItem.your_submissions || 0,
      partnerSubmissions: classItem.partnerSubmissions || classItem.partner_submissions || 0,
      cardioRating: classItem.cardioRating || classItem.cardio_rating || 3,
    });
    setShowForm(true);
  };

  const handleDelete = (classId: number) => {
    setClassToDelete(classId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (classToDelete) {
      deleteClassMutation.mutate(classToDelete);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check class limit for free tier users (only when creating new)
    if (!editingClassId && !isPremium && Array.isArray(classes) && classes.length >= FREE_TIER_LIMITS.classes) {
      toast({
        title: 'Class Limit Reached',
        description: `Free tier is limited to ${FREE_TIER_LIMITS.classes} classes. Upgrade to Premium for unlimited class logging!`,
        variant: 'destructive',
      });
      return;
    }
    
    const classData = {
      date: formData.date,
      time: formData.time,
      duration: formData.duration,
      classType: formData.type, // Map 'type' to 'classType' for schema
      instructor: formData.instructor,
      techniquesFocused: formData.notes, // Map 'notes' to 'techniquesFocused' for schema
      // Rolling tracking data
      rollingPartners: formData.rollingPartners ? formData.rollingPartners.split(',').map(p => p.trim()).filter(p => p) : [],
      yourSubmissions: formData.yourSubmissions,
      partnerSubmissions: formData.partnerSubmissions,
      cardioRating: formData.cardioRating,
    };

    if (editingClassId) {
      // Update existing class
      updateClassMutation.mutate({ classId: editingClassId, classData });
    } else {
      // Create new class with summary
      createClassMutation.mutate({ 
        classData, 
        originalFormData: { ...formData }
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['duration', 'yourSubmissions', 'partnerSubmissions', 'cardioRating'].includes(name) 
        ? parseInt(value) || 0 
        : value
    }));
  };

  if (showForm) {
    return (
      <div className="p-6 max-w-md mx-auto bg-background min-h-screen">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {editingClassId ? 'Edit Class' : 'Log Class'}
          </h2>
          <button
            onClick={resetForm}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Time
            </label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              min="30"
              max="240"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
            >
              <option value="Gi">Gi</option>
              <option value="No Gi">No Gi</option>
              <option value="Open Mat">Open Mat</option>
              <option value="Competition">Competition</option>
              <option value="Drilling">Drilling</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructor
            </label>
            <input
              type="text"
              name="instructor"
              value={formData.instructor}
              onChange={handleInputChange}
              placeholder="Enter instructor name"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="What did you work on today?"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black placeholder-gray-500"
            />
          </div>

          {/* Rolling Partners Section */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-medium text-gray-700 mb-3">Rolling Session</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rolling Partners
              </label>
              <input
                type="text"
                name="rollingPartners"
                value={formData.rollingPartners}
                onChange={handleInputChange}
                placeholder="Who did you roll with? (comma separated)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black placeholder-gray-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Submissions
                </label>
                <input
                  type="number"
                  name="yourSubmissions"
                  value={formData.yourSubmissions}
                  onChange={handleInputChange}
                  min="0"
                  max="50"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partner Submissions
                </label>
                <input
                  type="number"
                  name="partnerSubmissions"
                  value={formData.partnerSubmissions}
                  onChange={handleInputChange}
                  min="0"
                  max="50"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                How did your cardio feel? (1-5)
              </label>
              <select
                name="cardioRating"
                value={formData.cardioRating}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
              >
                <option value={1}>1 - Exhausted</option>
                <option value={2}>2 - Tired</option>
                <option value={3}>3 - Average</option>
                <option value={4}>4 - Good</option>
                <option value={5}>5 - Excellent</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
          >
            {editingClassId ? 'Update Class' : 'Log Class'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-background min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Classes</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
        >
          + New Class
        </button>
      </div>



      {/* Classes List */}
      <div className="space-y-3">
        {classesArray.map((classItem: any, index: number) => {
          const isExpanded = expandedClassId === classItem.id;
          
          return (
            <div key={classItem.id} className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover-scale transition-all duration-200">
              {/* Clickable Header */}
              <div
                onClick={() => setExpandedClassId(isExpanded ? null : classItem.id)}
                className="cursor-pointer p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">{classItem.classType}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600 dark:text-gray-400">{classItem.duration}min</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(classItem.date).toLocaleDateString()}
                    {classItem.time && ` @ ${classItem.time}`}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>
              
              {/* Expandable Details */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-200 dark:border-slate-700 pt-3">
                  {/* Instructor Information */}
                  {classItem.instructor && (
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Instructor:</strong> {classItem.instructor}
                    </div>
                  )}
                  
                  {/* Notes/Techniques Focused */}
                  {classItem.techniquesFocused && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Notes:</strong> {classItem.techniquesFocused}
                    </div>
                  )}
                  
                  {/* Rolling Partners */}
                  {classItem.rollingPartners && classItem.rollingPartners.length > 0 && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Rolling Partners:</strong> {classItem.rollingPartners.join(', ')}
                    </div>
                  )}
                  
                  {/* Submissions and Cardio */}
                  {(classItem.yourSubmissions > 0 || classItem.partnerSubmissions > 0 || classItem.cardioRating) && (
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                      {(classItem.yourSubmissions > 0 || classItem.partnerSubmissions > 0) && (
                        <span>
                          <strong>Submissions:</strong> You {classItem.yourSubmissions || 0} - {classItem.partnerSubmissions || 0} Partners
                        </span>
                      )}
                      {classItem.cardioRating && (
                        <span>
                          <strong>Cardio:</strong> {classItem.cardioRating}/5 
                          {classItem.cardioRating === 1 && ' 😵'}
                          {classItem.cardioRating === 2 && ' 😓'}
                          {classItem.cardioRating === 3 && ' 😐'}
                          {classItem.cardioRating === 4 && ' 😊'}
                          {classItem.cardioRating === 5 && ' 💪'}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Edit and Delete Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(classItem);
                      }}
                      className="flex items-center gap-2 flex-1 justify-center px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors font-medium"
                      data-testid={`button-edit-class-${classItem.id}`}
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(classItem.id);
                      }}
                      className="flex items-center gap-2 flex-1 justify-center px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors font-medium"
                      data-testid={`button-delete-class-${classItem.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Delete Class?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this class? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setClassToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                data-testid="button-cancel-delete"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                data-testid="button-confirm-delete"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}