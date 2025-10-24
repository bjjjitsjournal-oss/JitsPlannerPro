import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest, queryClient } from '../lib/queryClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { Building2, Users, Copy, Check, Trash2 } from 'lucide-react';

export default function Admin() {
  const { user, supabaseUser } = useAuth();
  const { toast } = useToast();
  const [gymName, setGymName] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch all gyms
  const { data: gyms = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/gyms', { supabaseId: supabaseUser?.id }],
    queryFn: async () => {
      const url = `/api/gyms${supabaseUser?.id ? `?supabaseId=${supabaseUser.id}` : ''}`;
      const res = await fetch(url, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        }
      });
      if (!res.ok) throw new Error('Failed to fetch gyms');
      return res.json();
    },
    enabled: user?.role === 'admin' && !!supabaseUser
  });

  // Create gym mutation
  const createGymMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest('POST', '/api/gyms', { name, supabaseId: supabaseUser?.id });
    },
    onSuccess: (newGym: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/gyms'] });
      refetch(); // Force immediate refetch
      toast({
        title: "Gym created!",
        description: `${newGym.name} has been created with code: ${newGym.code}`,
      });
      setGymName('');
      // Auto-copy the code
      copyToClipboard(newGym.code);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create gym",
        variant: "destructive",
      });
    }
  });

  // Delete gym mutation
  const deleteGymMutation = useMutation({
    mutationFn: async (gymId: number) => {
      return await apiRequest('DELETE', `/api/gyms/${gymId}`, { supabaseId: supabaseUser?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gyms'] });
      refetch(); // Force immediate refetch
      toast({
        title: "Gym deleted!",
        description: "The gym has been successfully deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete gym",
        variant: "destructive",
      });
    }
  });

  const handleCreateGym = () => {
    if (!gymName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a gym name",
        variant: "destructive",
      });
      return;
    }
    createGymMutation.mutate(gymName);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: "Copied!",
      description: "Gym code copied to clipboard",
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Building2 className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gym Management</h1>
        </div>

        {/* Create Gym Section */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Create New Gym
          </h2>
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Enter gym name..."
              value={gymName}
              onChange={(e) => setGymName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateGym()}
              className="flex-1"
              data-testid="input-gym-name"
            />
            <Button 
              onClick={handleCreateGym}
              disabled={createGymMutation.isPending || !gymName.trim()}
              data-testid="button-create-gym"
            >
              {createGymMutation.isPending ? 'Creating...' : 'Create Gym'}
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            A unique code will be auto-generated for the gym
          </p>
        </Card>

        {/* Gyms List */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Gyms ({gyms.length})
          </h2>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading gyms...</div>
          ) : gyms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No gyms created yet. Create your first gym above!
            </div>
          ) : (
            <div className="space-y-4">
              {gyms.map((gym: any) => (
                <Card key={gym.id} className="p-4" data-testid={`card-gym-${gym.id}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{gym.name}</h3>
                      <p className="text-sm text-gray-500">
                        Created {new Date(gym.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Gym Code</p>
                        <p className="text-lg font-mono font-bold text-blue-600">{gym.code}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(gym.code)}
                        data-testid={`button-copy-${gym.code}`}
                      >
                        {copiedCode === gym.code ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${gym.name}? This action cannot be undone.`)) {
                            deleteGymMutation.mutate(gym.id);
                          }
                        }}
                        disabled={deleteGymMutation.isPending}
                        data-testid={`button-delete-${gym.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
