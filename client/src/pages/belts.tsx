import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Award, Calendar as CalendarIcon, User, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { beltsQueries } from "@/lib/supabaseQueries";
import type { Belt } from "@shared/schema";

interface BeltFormData {
  belt: string;
  stripes: number;
  promotionDate: string;
  instructor: string;
  notes: string;
}

export default function Belts() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [editingBelt, setEditingBelt] = useState<Belt | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<BeltFormData>({
    belt: "white",
    stripes: 0,
    promotionDate: new Date().toISOString().split('T')[0],
    instructor: "",
    notes: "",
  });

  const { data: belts = [], isLoading } = useQuery<Belt[]>({
    queryKey: ["belts", user?.id],
    queryFn: () => beltsQueries.getAll(user!.id),
    enabled: !!user?.id,
  });

  const { data: currentBelt } = useQuery<Belt>({
    queryKey: ["belts", "current", user?.id],
    queryFn: () => beltsQueries.getCurrent(user!.id),
    enabled: !!user?.id,
  });

  const createBeltMutation = useMutation({
    mutationFn: async (data: BeltFormData) => {
      if (!user?.id) throw new Error('User not authenticated');
      return await beltsQueries.create(user.id, {
        belt: data.belt,
        stripes: data.stripes,
        promotionDate: data.promotionDate,
        instructor: data.instructor || "",
        notes: data.notes || "",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["belts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["belts", "current", user?.id] });
      setShowDialog(false);
      toast({ title: "Belt promotion added!", description: "Your belt progression has been recorded." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add belt promotion. Please try again.", variant: "destructive" });
    },
  });

  const updateBeltMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: BeltFormData }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return await beltsQueries.update(id, user.id, {
        belt: data.belt,
        stripes: data.stripes,
        promotionDate: data.promotionDate,
        instructor: data.instructor || "",
        notes: data.notes || "",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["belts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["belts", "current", user?.id] });
      setShowDialog(false);
      setEditingBelt(null);
      toast({ title: "Belt updated!", description: "Your belt progression has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update belt. Please try again.", variant: "destructive" });
    },
  });

  const deleteBeltMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!user?.id) throw new Error('User not authenticated');
      return await beltsQueries.delete(id, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["belts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["belts", "current", user?.id] });
      toast({ title: "Belt promotion deleted", description: "The belt promotion has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete belt promotion. Please try again.", variant: "destructive" });
    },
  });

  const openEditDialog = (belt: Belt) => {
    const promotionDate = (belt as any).promotion_date || belt.promotionDate;
    setEditingBelt(belt);
    setFormData({
      belt: belt.belt,
      stripes: belt.stripes,
      promotionDate: promotionDate ? new Date(promotionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      instructor: belt.instructor || "",
      notes: belt.notes || "",
    });
    setShowDialog(true);
  };

  const openAddDialog = () => {
    if (currentBelt) {
      openEditDialog(currentBelt);
    } else {
      setEditingBelt(null);
      setFormData({
        belt: "white",
        stripes: 0,
        promotionDate: new Date().toISOString().split('T')[0],
        instructor: "",
        notes: "",
      });
      setShowDialog(true);
    }
  };

  const handleSubmit = () => {
    if (editingBelt) {
      updateBeltMutation.mutate({ id: editingBelt.id, data: formData });
    } else {
      createBeltMutation.mutate(formData);
    }
  };

  const formatDate = (belt: any) => {
    const dateValue = belt?.promotion_date || belt?.promotionDate;
    if (!dateValue) return 'N/A';
    try {
      return format(new Date(dateValue), "MMM d, yyyy");
    } catch {
      return 'N/A';
    }
  };

  const BeltVisual = ({ belt, stripes, size = "md" }: { belt: string; stripes: number; size?: "sm" | "md" | "lg" }) => {
    const sizeClasses = { sm: "w-16 h-4", md: "w-24 h-6", lg: "w-32 h-8" };
    const stripeSizeClasses = { sm: "w-1 h-3", md: "w-1.5 h-4", lg: "w-2 h-5" };

    const getBeltColor = (c: string) => ({
      white: "bg-white border-2 border-gray-400",
      blue: "bg-blue-600",
      purple: "bg-purple-600",
      brown: "bg-amber-800",
      black: "bg-black"
    }[c] || "bg-gray-400");

    const getBeltTipColor = (c: string) => ({
      white: "bg-gray-800",
      blue: "bg-blue-800",
      purple: "bg-purple-800",
      brown: "bg-amber-900",
      black: "bg-gray-900"
    }[c] || "bg-gray-600");

    return (
      <div className="flex items-center gap-2">
        <div className={`${getBeltColor(belt)} ${sizeClasses[size]} rounded-sm shadow-md relative flex items-center justify-center`}>
          <div className={`${getBeltTipColor(belt)} absolute left-0 top-0 bottom-0 w-2 rounded-l-sm`}></div>
          <span className={`${belt === 'white' ? 'text-black' : 'text-white'} font-bold text-xs`}>BJJ</span>
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex gap-0.5">
            {Array.from({ length: stripes }).map((_, i) => (
              <div key={i} className={`${stripeSizeClasses[size]} bg-gray-300 rounded-sm`}></div>
            ))}
          </div>
        </div>
        <div className="text-sm font-medium capitalize text-black dark:text-white">
          {belt} Belt {stripes > 0 && `(${stripes} stripe${stripes !== 1 ? 's' : ''})`}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Belt Progression</h1>
        <p className="text-gray-600 dark:text-gray-300">Track your BJJ belt promotions and achievements</p>
      </div>

      <Card className="bg-gradient-to-r from-bjj-navy to-blue-800 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-6 w-6" />
            Current Belt Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentBelt ? (
            <div className="flex items-center justify-center">
              <BeltVisual belt={currentBelt.belt} stripes={currentBelt.stripes} size="lg" />
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-300">No current belt recorded</p>
              <p className="text-sm text-gray-400">Add your first belt promotion below</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Award className="h-6 w-6" />
          Promotion History
        </h2>

        {belts.length === 0 ? (
          <Card className="p-8 text-center">
            <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No promotions recorded yet</h3>
            <p className="text-gray-500">Add your first belt promotion below!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {belts.map((belt) => (
              <Card key={belt.id} className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <BeltVisual belt={belt.belt} stripes={belt.stripes} size="md" />
                      <div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {formatDate(belt)}
                          </span>
                          {belt.instructor && (
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {belt.instructor}
                            </span>
                          )}
                        </div>
                        {belt.notes && (
                          <p className="text-sm text-gray-600 mt-2 max-w-md">{belt.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(belt)}
                        className="text-blue-600 hover:text-blue-700 bg-white border-2 border-blue-200 hover:bg-blue-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this belt promotion?')) {
                            deleteBeltMutation.mutate(belt.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700 bg-white border-2 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center mt-8">
        <Button
          onClick={openAddDialog}
          className="bg-bjj-red hover:bg-red-600 text-white px-8 py-3 text-lg"
          size="lg"
        >
          {currentBelt ? "Update Belt Status" : "Add First Belt"}
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) setEditingBelt(null); }}>
        <DialogContent className="bg-white max-w-md w-full mx-4">
          <DialogHeader>
            <DialogTitle className="text-gray-800">
              {editingBelt ? "Edit Belt Promotion" : "Add Belt Promotion"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Belt Color</label>
              <select
                value={formData.belt}
                onChange={(e) => setFormData({ ...formData, belt: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="white">White Belt</option>
                <option value="blue">Blue Belt</option>
                <option value="purple">Purple Belt</option>
                <option value="brown">Brown Belt</option>
                <option value="black">Black Belt</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stripes</label>
              <select
                value={formData.stripes}
                onChange={(e) => setFormData({ ...formData, stripes: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">No Stripes</option>
                <option value="1">1 Stripe</option>
                <option value="2">2 Stripes</option>
                <option value="3">3 Stripes</option>
                <option value="4">4 Stripes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Date</label>
              <input
                type="date"
                value={formData.promotionDate}
                onChange={(e) => setFormData({ ...formData, promotionDate: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructor (Optional)</label>
              <Input
                placeholder="Professor who promoted you"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                className="bg-white text-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <Textarea
                placeholder="Add any notes about this promotion..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="resize-none bg-white text-gray-800"
                rows={3}
              />
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowDialog(false); setEditingBelt(null); }}
                className="px-6 bg-white border-gray-300 text-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={createBeltMutation.isPending || updateBeltMutation.isPending}
                className="px-8 text-white"
                style={{ backgroundColor: '#dc2626' }}
              >
                {editingBelt
                  ? (updateBeltMutation.isPending ? "Updating..." : "Update Promotion")
                  : (createBeltMutation.isPending ? "Adding..." : "Add Promotion")
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
