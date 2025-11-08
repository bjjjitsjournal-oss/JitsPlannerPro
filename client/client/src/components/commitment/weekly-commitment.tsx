import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Target, Plus, Trophy, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WeeklyCommitment, InsertWeeklyCommitment } from "@shared/schema";

interface WeeklyCommitmentProps {
  weeklyClasses: number; // Current classes this week
}

export default function WeeklyCommitmentWidget({ weeklyClasses }: WeeklyCommitmentProps) {
  const [showForm, setShowForm] = useState(false);
  const [targetClasses, setTargetClasses] = useState(3);
  const { toast } = useToast();

  const { data: currentCommitment, isLoading } = useQuery<WeeklyCommitment | null>({
    queryKey: ["/api/weekly-commitments/current"],
  });



  const createCommitmentMutation = useMutation({
    mutationFn: async (data: InsertWeeklyCommitment) => {
      const response = await apiRequest("POST", "/api/weekly-commitments", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-commitments/current"] });
      queryClient.refetchQueries({ queryKey: ["/api/weekly-commitments/current"] });
      setShowForm(false);
      toast({
        title: "Success",
        description: "Weekly commitment set! Good luck this week!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to set weekly commitment",
        variant: "destructive",
      });
    },
  });

  const updateCommitmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertWeeklyCommitment> }) => {
      const response = await apiRequest("PUT", `/api/weekly-commitments/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-commitments/current"] });
    },
  });

  // Update completed classes when weeklyClasses changes
  useEffect(() => {
    if (currentCommitment && weeklyClasses !== currentCommitment.completedClasses) {
      const isCompleted = weeklyClasses >= currentCommitment.targetClasses ? 1 : 0;
      updateCommitmentMutation.mutate({
        id: currentCommitment.id,
        data: { 
          completedClasses: weeklyClasses,
          isCompleted 
        }
      });
    }
  }, [weeklyClasses, currentCommitment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (targetClasses < 1 || targetClasses > 10) {
      toast({
        title: "Invalid Target",
        description: "Please set a target between 1-10 classes",
        variant: "destructive",
      });
      return;
    }

    // Calculate the start of current week (Monday) in UTC
    const now = new Date();
    const utcNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const dayOfWeek = utcNow.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday as last day of week
    const startOfWeek = new Date(utcNow);
    startOfWeek.setUTCDate(utcNow.getUTCDate() + daysToMonday); // Monday
    startOfWeek.setUTCHours(0, 0, 0, 0);

    createCommitmentMutation.mutate({
      weekStartDate: startOfWeek,
      targetClasses,
      completedClasses: weeklyClasses,
      isCompleted: weeklyClasses >= targetClasses ? 1 : 0,
    });
  };

  const getProgressPercentage = () => {
    if (!currentCommitment || currentCommitment.targetClasses === 0) return 0;
    return Math.min((weeklyClasses / currentCommitment.targetClasses) * 100, 100);
  };

  const getMotivationalMessage = () => {
    if (!currentCommitment) return "";
    
    const remaining = currentCommitment.targetClasses - weeklyClasses;
    
    if (remaining <= 0) {
      return "Goal achieved! You're crushing it!";
    } else if (remaining === 1) {
      return "Just 1 more class to reach your goal!";
    } else {
      return `${remaining} more classes needed to reach your goal!`;
    }
  };

  const getRemainingClasses = () => {
    if (!currentCommitment) return 0;
    return Math.max(0, currentCommitment.targetClasses - weeklyClasses);
  };

  if (!currentCommitment && !showForm) {
    return (
      <Card className="border-dashed border-2 border-gray-300 hover:border-bjj-navy transition-colors">
        <CardContent className="text-center py-8">
          <Target className="w-10 h-10 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Set Your Weekly Goal</h3>
          <p className="text-gray-500 mb-4">Stay motivated by committing to a weekly class target</p>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-bjj-red hover:bg-red-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Set Weekly Goal
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-bjj-navy flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Weekly Commitment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="target">Classes this week</Label>
              <Input
                id="target"
                type="number"
                min="1"
                max="10"
                value={targetClasses}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setTargetClasses(1);
                  } else {
                    const parsed = parseInt(value);
                    if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
                      setTargetClasses(parsed);
                    }
                  }
                }}
                className="focus:ring-bjj-red focus:border-bjj-red"
              />
              <p className="text-sm text-gray-600 mt-1">Set a realistic goal (1-10 classes)</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                className="bg-bjj-red hover:bg-red-700"
                disabled={createCommitmentMutation.isPending}
              >
                {createCommitmentMutation.isPending ? "Setting..." : "Set Goal"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Display current commitment progress
  if (!currentCommitment) return null;
  
  return (
    <Card className={`${currentCommitment.isCompleted ? 'border-green-500 bg-green-50' : 'border-bjj-navy'}`}>
      <CardHeader>
        <CardTitle className="text-bjj-navy flex items-center justify-between">
          <div className="flex items-center">
            {currentCommitment.isCompleted ? (
              <Trophy className="w-5 h-5 mr-2 text-green-600" />
            ) : (
              <Target className="w-5 h-5 mr-2" />
            )}
            This Week's Goal
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {weeklyClasses}/{currentCommitment.targetClasses}
            </div>
            {!currentCommitment.isCompleted && (
              <div className="text-sm text-bjj-red font-semibold">
                {getRemainingClasses()} more needed
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  currentCommitment.isCompleted 
                    ? 'bg-green-500' 
                    : 'bg-gradient-to-r from-bjj-red to-red-600'
                }`}
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            <p className="text-sm text-center font-medium">
              {getProgressPercentage().toFixed(0)}% Complete
            </p>
          </div>

          {/* Remaining Classes Display */}
          {!currentCommitment.isCompleted && (
            <div className="text-center bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-center space-x-2">
                <Target className="w-5 h-5 text-blue-600" />
                <span className="text-lg font-bold text-blue-600">
                  {getRemainingClasses()} more class{getRemainingClasses() !== 1 ? 'es' : ''} needed
                </span>
              </div>
              <p className="text-sm text-blue-600 mt-1">to reach your weekly goal</p>
            </div>
          )}

          {/* Motivational Message */}
          <div className="text-center">
            <p className="text-sm font-medium text-bjj-navy">
              {getMotivationalMessage()}
            </p>
          </div>

          {/* New Goal Button for Next Week */}
          {currentCommitment.isCompleted && (
            <div className="text-center pt-2">
              <Button
                onClick={() => setShowForm(true)}
                variant="outline"
                size="sm"
                className="text-bjj-navy border-bjj-navy hover:bg-bjj-navy hover:text-white"
              >
                <Flame className="w-4 h-4 mr-2" />
                Set Next Week's Goal
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}