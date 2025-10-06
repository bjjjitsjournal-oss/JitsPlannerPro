import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBeltSchema, type Belt, type InsertBelt } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Award, Calendar as CalendarIcon, User, Plus, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { beltsQueries } from "@/lib/supabaseQueries";

export default function Belts() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [editingBelt, setEditingBelt] = useState<Belt | null>(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);

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

  const form = useForm<InsertBelt>({
    resolver: zodResolver(insertBeltSchema),
    defaultValues: {
      belt: "white",
      stripes: 0,
      promotionDate: new Date(),
      instructor: "",
      notes: "",
    },
  });

  const createBeltMutation = useMutation({
    mutationFn: async (data: InsertBelt) => {
      if (!user?.id) throw new Error('User not authenticated');
      const beltData = {
        belt: data.belt,
        stripes: data.stripes || 0,
        promotionDate: data.promotionDate.toISOString().split('T')[0],
        instructor: data.instructor || "",
        notes: data.notes || "",
      };
      return await beltsQueries.create(user.id, beltData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["belts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["belts", "current", user?.id] });
      form.reset();
      setShowUpdateForm(false);
      toast({
        title: "Belt promotion added!",
        description: "Your belt progression has been recorded.",
      });
    },
    onError: (error: any) => {
      console.error("Create belt mutation error:", error);
      toast({
        title: "Error",
        description: "Failed to add belt promotion. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateBeltMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertBelt }) => {
      if (!user?.id) throw new Error('User not authenticated');
      const beltData = {
        belt: data.belt,
        stripes: data.stripes || 0,
        promotionDate: data.promotionDate.toISOString().split('T')[0],
        instructor: data.instructor || "",
        notes: data.notes || "",
      };
      return await beltsQueries.update(id, user.id, beltData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["belts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["belts", "current", user?.id] });
      form.reset();
      setShowUpdateForm(false);
      setEditingBelt(null);
      toast({
        title: "Belt updated!",
        description: "Your belt progression has been updated.",
      });
    },
    onError: (error: any) => {
      console.error("Update belt mutation error:", error);
      toast({
        title: "Error",
        description: "Failed to update belt. Please try again.",
        variant: "destructive",
      });
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
      toast({
        title: "Belt promotion deleted",
        description: "The belt promotion has been removed.",
      });
    },
    onError: (error: any) => {
      console.error("Delete belt mutation error:", error);
      toast({
        title: "Error",
        description: "Failed to delete belt promotion. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertBelt) => {
    if (editingBelt) {
      updateBeltMutation.mutate({ id: editingBelt.id, data });
    } else {
      createBeltMutation.mutate(data);
    }
  };

  const handleEdit = (belt: Belt) => {
    setEditingBelt(belt);
    setShowUpdateForm(true);
    form.setValue("belt", belt.belt);
    form.setValue("stripes", belt.stripes);
    form.setValue("promotionDate", new Date(belt.promotionDate));
    form.setValue("instructor", belt.instructor || "");
    form.setValue("notes", belt.notes || "");
  };

  const handleCancelEdit = () => {
    setEditingBelt(null);
    setShowUpdateForm(false);
    form.reset();
  };

  const handleStartUpdate = () => {
    if (currentBelt) {
      handleEdit(currentBelt);
    }
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), "MMM d, yyyy");
  };

  // Visual belt component with proper belt tip and stripes
  const BeltVisual = ({ belt, stripes, size = "md" }: { belt: string; stripes: number; size?: "sm" | "md" | "lg" }) => {
    const sizeClasses = {
      sm: "w-16 h-4",
      md: "w-24 h-6", 
      lg: "w-32 h-8"
    };

    const stripeSizeClasses = {
      sm: "w-1 h-3",
      md: "w-1.5 h-4",
      lg: "w-2 h-5"
    };

    const getBeltColor = (beltColor: string) => {
      const colors = {
        white: "bg-white border-2 border-gray-400",
        blue: "bg-blue-600",
        purple: "bg-purple-600", 
        brown: "bg-amber-800",
        black: "bg-black"
      };
      return colors[beltColor as keyof typeof colors] || "bg-gray-400";
    };

    const getBeltTipColor = (beltColor: string) => {
      const colors = {
        white: "bg-gray-800",
        blue: "bg-blue-800",
        purple: "bg-purple-800", 
        brown: "bg-amber-900",
        black: "bg-gray-900"
      };
      return colors[beltColor as keyof typeof colors] || "bg-gray-600";
    };

    return (
      <div className="flex items-center gap-2">
        <div className={`${getBeltColor(belt)} ${sizeClasses[size]} rounded-sm shadow-md relative flex items-center justify-center`}>
          {/* Belt tip */}
          <div className={`${getBeltTipColor(belt)} absolute left-0 top-0 bottom-0 w-2 rounded-l-sm`}></div>
          
          {/* Belt text */}
          <span className={`${belt === 'white' ? 'text-black' : 'text-white'} font-bold text-xs`}>
            BJJ
          </span>
          
          {/* Stripes on belt */}
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex gap-0.5">
            {Array.from({ length: stripes }).map((_, i) => (
              <div key={i} className={`${stripeSizeClasses[size]} bg-gray-300 rounded-sm`}></div>
            ))}
          </div>
        </div>
        
        <div className="text-sm font-medium capitalize text-black">
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

      {/* Current Belt Status */}
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

      {/* Belt History */}
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
                            {formatDate(belt.promotionDate)}
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
                        onClick={() => handleEdit(belt)}
                        className="text-blue-600 hover:text-blue-700 bg-white border-2 border-blue-200 hover:bg-blue-50"
                        style={{ 
                          position: 'relative', 
                          zIndex: 100,
                          backgroundColor: 'white',
                          border: '2px solid #dbeafe'
                        }}
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
                        style={{ 
                          position: 'relative', 
                          zIndex: 100,
                          backgroundColor: 'white',
                          border: '2px solid #fecaca'
                        }}
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

      {/* Update Button - positioned at bottom */}
      <div className="flex justify-center mt-8">
        <Button
          onClick={() => setShowUpdateForm(true)}
          className="bg-bjj-red hover:bg-red-600 text-white px-8 py-3 text-lg border-2 border-bjj-red"
          size="lg"
          style={{ 
            position: 'relative', 
            zIndex: 100,
            backgroundColor: '#dc2626',
            borderColor: '#dc2626'
          }}
        >
          {currentBelt ? "Update Belt Status" : "Add First Belt"}
        </Button>
      </div>

      {/* Update Belt Form - Only shown when updating */}
      {showUpdateForm && (
        <Card className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
              {editingBelt ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingBelt ? "Edit Belt Promotion" : "Add Belt Promotion"}
            </CardTitle>
            <CardDescription>
              {editingBelt ? "Update your belt promotion details" : "Record your belt or stripe promotion"}
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-white relative">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-white relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="belt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black">Belt Color</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white text-black">
                              <SelectValue placeholder="Select belt color" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white text-black">
                            <SelectItem value="white" className="text-black">White Belt</SelectItem>
                            <SelectItem value="blue" className="text-black">Blue Belt</SelectItem>
                            <SelectItem value="purple" className="text-black">Purple Belt</SelectItem>
                            <SelectItem value="brown" className="text-black">Brown Belt</SelectItem>
                            <SelectItem value="black" className="text-black">Black Belt</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stripes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black">Stripes</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger className="bg-white text-black">
                              <SelectValue placeholder="Number of stripes" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white text-black">
                            <SelectItem value="0" className="text-black">No Stripes</SelectItem>
                            <SelectItem value="1" className="text-black">1 Stripe</SelectItem>
                            <SelectItem value="2" className="text-black">2 Stripes</SelectItem>
                            <SelectItem value="3" className="text-black">3 Stripes</SelectItem>
                            <SelectItem value="4" className="text-black">4 Stripes</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="promotionDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-black">Promotion Date</FormLabel>
                        <Popover modal={true}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal bg-white text-black",
                                  !field.value && "text-gray-500"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start" side="top" sideOffset={5}>
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="instructor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black">Instructor (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Professor who promoted you" className="bg-white text-black" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any notes about this promotion..."
                          className="resize-none bg-white text-black"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </form>
            </Form>
          </CardContent>
          
          {/* Completely separate button container */}
          <div className="px-6 pb-6 bg-white">
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <Button 
                type="button" 
                variant="outline"
                onClick={handleCancelEdit}
                className="px-6 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                style={{ 
                  position: 'relative', 
                  zIndex: 1000,
                  backgroundColor: 'white',
                  border: '2px solid #d1d5db'
                }}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={() => {
                  const formData = form.getValues();
                  if (editingBelt) {
                    updateBeltMutation.mutate({ id: editingBelt.id, data: formData });
                  } else {
                    createBeltMutation.mutate(formData);
                  }
                }}
                disabled={createBeltMutation.isPending || updateBeltMutation.isPending}
                className="px-8 text-white border-2"
                style={{ 
                  position: 'relative', 
                  zIndex: 1000,
                  backgroundColor: '#dc2626',
                  borderColor: '#dc2626'
                }}
              >
                {editingBelt ? (
                  updateBeltMutation.isPending ? "Updating..." : "Update Promotion"
                ) : (
                  createBeltMutation.isPending ? "Adding..." : "Add Promotion"
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}