import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { gamePlansQueries } from '../lib/supabaseQueries';
import { useToast } from '../hooks/use-toast';
import { ChevronRight, ChevronDown, Plus, Sparkles, Edit2, Trash2 } from 'lucide-react';
import { apiRequest } from '../lib/queryClient';

interface GamePlanMove {
  id: string;
  planName: string;
  moveName: string;
  description?: string;
  parentId?: string | null;
  moveOrder: number;
  children?: GamePlanMove[];
}

interface CounterMove {
  moveName: string;
  description: string;
}

export default function GamePlans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showNewPlanForm, setShowNewPlanForm] = useState(false);
  const [showMoveForm, setShowMoveForm] = useState(false);
  const [expandedMoves, setExpandedMoves] = useState<Set<string>>(new Set());
  const [editingMove, setEditingMove] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<CounterMove[]>([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);

  const [newPlanName, setNewPlanName] = useState('');
  const [moveData, setMoveData] = useState({
    moveName: '',
    description: '',
    parentId: null as string | null,
  });

  // Get plan names
  const { data: planNames = [] } = useQuery({
    queryKey: ['game-plan-names', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await gamePlansQueries.getPlanNames(user.id);
    },
    enabled: !!user?.id,
  });

  // Get moves for selected plan
  const { data: moves = [] } = useQuery({
    queryKey: ['game-plans', user?.id, selectedPlan],
    queryFn: async () => {
      if (!user?.id || !selectedPlan) return [];
      return await gamePlansQueries.getByPlanName(user.id, selectedPlan);
    },
    enabled: !!user?.id && !!selectedPlan,
  });

  // Build tree structure from flat list
  const buildTree = (flatMoves: any[]): GamePlanMove[] => {
    const moveMap = new Map<string, GamePlanMove>();
    const rootMoves: GamePlanMove[] = [];

    // First pass: create all nodes
    flatMoves.forEach(move => {
      moveMap.set(move.id, { ...move, children: [] });
    });

    // Second pass: build tree
    flatMoves.forEach(move => {
      const node = moveMap.get(move.id)!;
      if (!move.parent_id && !move.parentId) {
        rootMoves.push(node);
      } else {
        const parentId = move.parent_id || move.parentId;
        const parent = moveMap.get(parentId);
        if (parent) {
          parent.children!.push(node);
        } else {
          rootMoves.push(node); // Orphaned node becomes root
        }
      }
    });

    return rootMoves;
  };

  const moveTree = buildTree(moves);

  // Create move mutation
  const createMoveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user?.id) throw new Error('User not authenticated');
      return await gamePlansQueries.create(user.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-plans', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['game-plan-names', user?.id] });
      toast({
        title: 'Move Added!',
        description: 'Your move has been added to the game plan.',
        duration: 4000,
      });
      resetMoveForm();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add move. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Update move mutation
  const updateMoveMutation = useMutation({
    mutationFn: async ({ moveId, data }: { moveId: string; data: any }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return await gamePlansQueries.update(moveId, user.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-plans', user?.id] });
      toast({
        title: 'Move Updated!',
        description: 'Your move has been updated.',
        duration: 4000,
      });
      resetMoveForm();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update move. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete move mutation
  const deleteMoveMutation = useMutation({
    mutationFn: async (moveId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      return await gamePlansQueries.delete(moveId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-plans', user?.id] });
      toast({
        title: 'Move Deleted',
        description: 'The move and all its counter moves have been removed.',
        duration: 4000,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete move. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const resetMoveForm = () => {
    setShowMoveForm(false);
    setEditingMove(null);
    setMoveData({ moveName: '', description: '', parentId: null });
    setAiSuggestions([]);
    setShowAiSuggestions(false);
  };

  const handleCreatePlan = () => {
    if (!newPlanName.trim()) return;
    
    // Create first move (root) for the plan
    createMoveMutation.mutate({
      planName: newPlanName.trim(),
      moveName: 'Starting Position',
      description: 'Define your starting position here',
      parentId: null,
      moveOrder: 0,
    });

    setSelectedPlan(newPlanName.trim());
    setNewPlanName('');
    setShowNewPlanForm(false);
  };

  const handleAddMove = () => {
    if (!moveData.moveName.trim() || !selectedPlan) return;

    if (editingMove) {
      updateMoveMutation.mutate({
        moveId: editingMove,
        data: {
          moveName: moveData.moveName,
          description: moveData.description,
        },
      });
    } else {
      createMoveMutation.mutate({
        planName: selectedPlan,
        moveName: moveData.moveName,
        description: moveData.description,
        parentId: moveData.parentId,
        moveOrder: 0,
      });
    }
  };

  const handleAiSuggest = async (currentMove: GamePlanMove) => {
    setAiLoading(true);
    setShowAiSuggestions(true);
    
    try {
      const data = await apiRequest('/api/game-plans/ai-suggest', {
        method: 'POST',
        body: JSON.stringify({
          currentMove: currentMove.moveName,
          position: selectedPlan || 'General Position',
          context: currentMove.description || '',
        }),
      });

      setAiSuggestions(data.counterMoves || []);
      
      toast({
        title: 'AI Suggestions Ready!',
        description: `Found ${data.counterMoves?.length || 0} counter move suggestions.`,
        duration: 4000,
      });
    } catch (error: any) {
      toast({
        title: 'AI Error',
        description: error.message || 'Failed to generate suggestions. Make sure OpenAI API key is configured.',
        variant: 'destructive',
      });
      setShowAiSuggestions(false);
    } finally {
      setAiLoading(false);
    }
  };

  const handleEdit = (move: GamePlanMove) => {
    setEditingMove(move.id);
    setMoveData({
      moveName: move.moveName,
      description: move.description || '',
      parentId: move.parentId || null,
    });
    setShowMoveForm(true);
  };

  const handleDelete = (moveId: string) => {
    if (confirm('Delete this move and all its counter moves?')) {
      deleteMoveMutation.mutate(moveId);
    }
  };

  const toggleExpand = (moveId: string) => {
    const newExpanded = new Set(expandedMoves);
    if (newExpanded.has(moveId)) {
      newExpanded.delete(moveId);
    } else {
      newExpanded.add(moveId);
    }
    setExpandedMoves(newExpanded);
  };

  const renderMoveTree = (moves: GamePlanMove[], depth: number = 0) => {
    return moves.map(move => (
      <div key={move.id} className={`${depth > 0 ? 'ml-6 border-l-2 border-blue-200 dark:border-blue-800' : ''}`}>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-3 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {move.children && move.children.length > 0 && (
                  <button
                    onClick={() => toggleExpand(move.id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    data-testid={`button-toggle-${move.id}`}
                  >
                    {expandedMoves.has(move.id) ? (
                      <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                )}
                <h3 className="font-semibold text-gray-900 dark:text-white">{move.moveName}</h3>
              </div>
              {move.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 ml-9">{move.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setMoveData({ moveName: '', description: '', parentId: move.id });
                  setShowMoveForm(true);
                }}
                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                title="Add counter move"
                data-testid={`button-add-counter-${move.id}`}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleAiSuggest(move)}
                disabled={aiLoading}
                className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded transition-colors disabled:opacity-50"
                title="AI suggest counter moves"
                data-testid={`button-ai-suggest-${move.id}`}
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleEdit(move)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                data-testid={`button-edit-${move.id}`}
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(move.id)}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                data-testid={`button-delete-${move.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {move.children && move.children.length > 0 && expandedMoves.has(move.id) && (
          <div className="mt-2">
            {renderMoveTree(move.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-background min-h-screen pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">Competition Game Plans</h1>
        <button
          onClick={() => setShowNewPlanForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          data-testid="button-new-plan"
        >
          <Plus className="w-5 h-5" />
          New Plan
        </button>
      </div>

      {/* Plan Selector */}
      {planNames.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Game Plan
          </label>
          <select
            value={selectedPlan || ''}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            data-testid="select-plan"
          >
            <option value="">Choose a plan...</option>
            {planNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      )}

      {/* New Plan Form */}
      {showNewPlanForm && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Create New Game Plan</h2>
          <input
            type="text"
            value={newPlanName}
            onChange={(e) => setNewPlanName(e.target.value)}
            placeholder="Game Plan Name (e.g., Closed Guard Strategy)"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            data-testid="input-plan-name"
          />
          <div className="flex gap-3">
            <button
              onClick={handleCreatePlan}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              data-testid="button-create-plan"
            >
              Create Plan
            </button>
            <button
              onClick={() => {
                setShowNewPlanForm(false);
                setNewPlanName('');
              }}
              className="flex-1 border border-gray-300 dark:border-gray-600 py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              data-testid="button-cancel-plan"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Move Form */}
      {showMoveForm && selectedPlan && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingMove ? 'Edit Move' : 'Add New Move'}
          </h2>
          <input
            type="text"
            value={moveData.moveName}
            onChange={(e) => setMoveData({ ...moveData, moveName: e.target.value })}
            placeholder="Move Name"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            data-testid="input-move-name"
          />
          <textarea
            value={moveData.description}
            onChange={(e) => setMoveData({ ...moveData, description: e.target.value })}
            placeholder="Description (optional)"
            rows={3}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            data-testid="input-move-description"
          />
          <div className="flex gap-3">
            <button
              onClick={handleAddMove}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              data-testid="button-save-move"
            >
              {editingMove ? 'Update Move' : 'Add Move'}
            </button>
            <button
              onClick={resetMoveForm}
              className="flex-1 border border-gray-300 dark:border-gray-600 py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              data-testid="button-cancel-move"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {showAiSuggestions && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">AI Counter Move Suggestions</h3>
          </div>
          
          {aiLoading ? (
            <p className="text-purple-700 dark:text-purple-300">Generating suggestions...</p>
          ) : aiSuggestions.length > 0 ? (
            <div className="space-y-3">
              {aiSuggestions.map((suggestion, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {suggestion.moveName}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {suggestion.description}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setMoveData({
                          moveName: suggestion.moveName,
                          description: suggestion.description,
                          parentId: moveData.parentId,
                        });
                        setShowMoveForm(true);
                        setShowAiSuggestions(false);
                      }}
                      className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                      data-testid={`button-use-suggestion-${index}`}
                    >
                      Use This
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-purple-700 dark:text-purple-300">No suggestions available.</p>
          )}
        </div>
      )}

      {/* Move Tree */}
      {selectedPlan && moveTree.length > 0 ? (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{selectedPlan}</h2>
          {renderMoveTree(moveTree)}
        </div>
      ) : selectedPlan ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>No moves in this game plan yet.</p>
          <p className="text-sm mt-2">Click "New Plan" to create your first move.</p>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>Select a game plan or create a new one to get started.</p>
        </div>
      )}
    </div>
  );
}
