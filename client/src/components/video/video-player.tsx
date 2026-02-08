import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { WeddingVideo, VideoRevision, InsertVideoRevision } from "@shared/schema";

interface VideoPlayerProps {
  video: WeddingVideo;
  revisions: VideoRevision[];
  onRevisionAdd?: (revision: VideoRevision) => void;
}

export default function VideoPlayer({ video, revisions, onRevisionAdd }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionComment, setRevisionComment] = useState("");
  const [revisionPriority, setRevisionPriority] = useState<"low" | "medium" | "high">("medium");
  const [revisionCreator, setRevisionCreator] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createRevisionMutation = useMutation({
    mutationFn: async (data: InsertVideoRevision) => {
      const response = await apiRequest("POST", `/api/videos/${video.id}/revisions`, data);
      return response.json();
    },
    onSuccess: (newRevision) => {
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${video.id}/revisions`] });
      toast({
        title: "Success",
        description: "Revision comment added successfully!",
      });
      setShowRevisionForm(false);
      setRevisionComment("");
      setRevisionCreator("");
      onRevisionAdd?.(newRevision);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add revision comment",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
    };
  }, []);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.volume = value[0];
      setVolume(value[0]);
      setIsMuted(value[0] === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const addRevisionAtCurrentTime = () => {
    setShowRevisionForm(true);
  };

  const handleSubmitRevision = () => {
    if (!revisionComment.trim() || !revisionCreator.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    createRevisionMutation.mutate({
      videoId: video.id,
      timestamp: Math.floor(currentTime),
      comment: revisionComment,
      priority: revisionPriority,
      createdBy: revisionCreator,
    });
  };

  const jumpToRevision = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      setCurrentTime(timestamp);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500 text-white";
      case "medium": return "bg-yellow-500 text-black";
      case "low": return "bg-green-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return "bg-green-100 text-green-800";
      case "addressed": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Video Player */}
      <Card className="bg-white shadow-lg">
        <CardContent className="p-0">
          <div ref={containerRef} className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={video.fileUrl}
              className="w-full h-auto max-h-96 object-contain"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlayPause}
                  className="text-white hover:text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skipTime(-10)}
                  className="text-white hover:text-white hover:bg-white/20"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skipTime(10)}
                  className="text-white hover:text-white hover:bg-white/20"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>

                <div className="flex-1 flex items-center space-x-2">
                  <span className="text-white text-sm">{formatTime(currentTime)}</span>
                  <Slider
                    value={[currentTime]}
                    max={duration}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="flex-1"
                  />
                  <span className="text-white text-sm">{formatTime(duration)}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.1}
                    onValueChange={handleVolumeChange}
                    className="w-20"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addRevisionAtCurrentTime}
                  className="text-white hover:text-white hover:bg-white/20"
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revision Form */}
      {showRevisionForm && (
        <Card className="bg-white shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Add Revision Comment at {formatTime(currentTime)}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Your Name</label>
                <input
                  type="text"
                  value={revisionCreator}
                  onChange={(e) => setRevisionCreator(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your name"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Priority</label>
                <Select value={revisionPriority} onValueChange={(value: any) => setRevisionPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Comment</label>
                <Textarea
                  value={revisionComment}
                  onChange={(e) => setRevisionComment(e.target.value)}
                  placeholder="Describe the revision needed..."
                  className="min-h-24"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowRevisionForm(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitRevision}
                  disabled={createRevisionMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {createRevisionMutation.isPending ? "Adding..." : "Add Revision"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revision List */}
      <Card className="bg-white shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Revision Comments ({revisions.length})</h3>
          
          {revisions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No revision comments yet</p>
              <p className="text-sm">Click the comment button while playing to add feedback</p>
            </div>
          ) : (
            <div className="space-y-4">
              {revisions.map((revision) => (
                <div key={revision.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => jumpToRevision(revision.timestamp)}
                        className="text-purple-600 hover:text-purple-700"
                      >
                        {formatTime(revision.timestamp)}
                      </Button>
                      <Badge className={getPriorityColor(revision.priority)}>
                        {revision.priority}
                      </Badge>
                      <Badge className={getStatusColor(revision.status)}>
                        {revision.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-800">{revision.createdBy}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(revision.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700">{revision.comment}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}