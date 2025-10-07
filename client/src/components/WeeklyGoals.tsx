import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { weeklyCommitmentsQueries, classesQueries } from '@/lib/supabaseQueries';

export default function WeeklyGoals() {
  const [showForm, setShowForm] = useState(false);
  const [goalClasses, setGoalClasses] = useState(3);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Debug logging
  React.useEffect(() => {
    if (user) {
      console.log('WeeklyGoals user object:', { id: user.id, type: typeof user.id, email: user.email });
    }
  }, [user]);

  // Fetch current week's commitment
  const { data: currentCommitment, refetch: refetchCommitment } = useQuery({
    queryKey: ['weeklyCommitments', 'current', user?.id],
    queryFn: () => weeklyCommitmentsQueries.getCurrent(user!.id),
    enabled: !!user?.id,
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 2000, // Refetch every 2 seconds for updates
    gcTime: 0, // Don't cache results
    retry: false, // Don't retry on failure
  });

  // Fetch current week's classes for progress
  const { data: classes = [], refetch: refetchClasses } = useQuery({
    queryKey: ['classes', user?.id],
    queryFn: () => classesQueries.getAll(user!.id),
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 3000, // Refetch every 3 seconds
  });

  // Force refresh data when component mounts
  React.useEffect(() => {
    refetchCommitment();
    refetchClasses();
  }, [refetchCommitment, refetchClasses]);

  // Calculate this week's progress (start of week in UTC) - Sunday start
  const today = new Date();
  const thisWeekStart = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - today.getUTCDay() + 1);
  thisWeekStart.setUTCHours(0, 0, 0, 0);

  const thisWeekClasses = Array.isArray(classes) ? classes.filter((cls: any) => {
    const classDate = new Date(cls.date);
    return classDate >= thisWeekStart;
  }).length : 0;

  // Create/update commitment mutation
  const commitmentMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      if (currentCommitment && (currentCommitment as any).id) {
        return await weeklyCommitmentsQueries.update((currentCommitment as any).id, user.id, data);
      } else {
        return await weeklyCommitmentsQueries.create(user.id, data);
      }
    },
    onSuccess: (result) => {
      console.log('Weekly goal mutation success:', result);
      
      // Invalidate queries with new keys
      queryClient.invalidateQueries({ queryKey: ['weeklyCommitments', 'current', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['classes', user?.id] });
      
      // Force immediate refetch to ensure UI updates
      setTimeout(() => {
        refetchCommitment();
        refetchClasses();
      }, 100);
      
      setShowForm(false);
      
      toast({
        title: "Success",
        description: `Weekly goal set to ${goalClasses} classes!`,
        duration: 4000, // Explicitly set 4 second duration
      });
    },
  });

  const handleSetGoal = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (commitmentMutation.isPending) {
      return;
    }
    
    const today = new Date();
    // Calculate start of current week (Sunday-based week)
    const dayOfWeek = today.getUTCDay();
    // If today is Sunday (0), use today; otherwise go back to previous Sunday
    const daysToSunday = dayOfWeek === 0 ? 0 : -dayOfWeek;
    const weekStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + daysToSunday, 0, 0, 0, 0));
    
    console.log('FRONTEND: Creating goal for week:', weekStart.toISOString());
    

    
    commitmentMutation.mutate({
      weekStartDate: weekStart,
      targetClasses: goalClasses,
      completedClasses: thisWeekClasses,
      isCompleted: thisWeekClasses >= goalClasses ? 1 : 0,
    });
  };

  const goal = (currentCommitment as any)?.targetClasses || 0;
  const progress = thisWeekClasses;
  const progressPercentage = goal > 0 ? Math.min((progress / goal) * 100, 100) : 0;
  const remaining = Math.max(goal - progress, 0);



  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Weekly Goals</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {currentCommitment ? 'Update' : 'Set Goal'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSetGoal} className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Classes this week: {goalClasses}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={goalClasses}
              onChange={(e) => setGoalClasses(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={commitmentMutation.isPending}
              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {commitmentMutation.isPending ? 'Saving...' : 'Set Goal'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {currentCommitment ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Progress this week</span>
            <span className="text-sm font-medium text-gray-800">
              {progress} / {goal} classes
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                progressPercentage >= 100 
                  ? 'bg-green-500' 
                  : progressPercentage >= 75 
                    ? 'bg-yellow-500' 
                    : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className={`${progressPercentage >= 100 ? 'text-green-600' : 'text-gray-600'}`}>
              {progressPercentage >= 100 ? (
                <span className="font-medium">🎉 Goal completed!</span>
              ) : remaining === 1 ? (
                <span>{remaining} more class to go!</span>
              ) : remaining > 1 ? (
                <span>{remaining} more classes to go!</span>
              ) : (
                <span>Keep it up!</span>
              )}
            </div>
            <div className="text-gray-500">
              {Math.round(progressPercentage)}%
            </div>
          </div>

          {progressPercentage >= 100 && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg text-center">
              <div className="text-green-800 font-medium text-sm">
                Excellent work this week! 🥋
              </div>
              <div className="text-green-600 text-xs mt-1">
                You've reached your training goal
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">No weekly goal set yet.</p>
          <p className="text-xs">Set a goal to track your progress!</p>
        </div>
      )}
    </div>
  );
}