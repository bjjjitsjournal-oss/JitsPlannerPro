import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface StorageUsageData {
  storageUsed: number;
  storageUsedFormatted: string;
  quota: number;
  quotaFormatted: string;
  remaining: number;
  remainingFormatted: string;
  percentage: number;
  tier: string;
  tierName: string;
}

export function StorageUsageTracker() {
  const { data: storageData, isLoading } = useQuery<StorageUsageData>({
    queryKey: ["/api/storage/usage"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Video Storage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!storageData) {
    return null;
  }

  const { percentage, storageUsedFormatted, quotaFormatted, tierName, tier } = storageData;
  const isNearLimit = percentage >= 80;
  const isFull = percentage >= 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Video Storage
        </CardTitle>
        <CardDescription>{tierName} Plan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Used</span>
            <span className="font-medium">
              {storageUsedFormatted} / {quotaFormatted}
            </span>
          </div>
          
          <Progress 
            value={Math.min(percentage, 100)} 
            className="h-2"
            data-testid="storage-progress-bar"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{percentage.toFixed(1)}% used</span>
            {!isFull && (
              <span>{storageData.remainingFormatted} remaining</span>
            )}
          </div>
        </div>

        {isFull && (
          <Alert variant="destructive" data-testid="alert-storage-full">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Storage limit reached. Delete videos or upgrade to continue uploading.
            </AlertDescription>
          </Alert>
        )}

        {!isFull && isNearLimit && (
          <Alert data-testid="alert-storage-warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You're running low on storage. Consider upgrading for more space.
            </AlertDescription>
          </Alert>
        )}

        {!isNearLimit && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="storage-ok">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Storage space available</span>
          </div>
        )}

        {tier === 'free' && (
          <div className="pt-2">
            <Link href="/settings?tab=subscription">
              <Button 
                variant="outline" 
                className="w-full"
                data-testid="button-upgrade-storage"
              >
                Upgrade for More Storage
              </Button>
            </Link>
          </div>
        )}

        {tier !== 'free' && tier !== 'gym_pro' && (
          <div className="pt-2">
            <Link href="/settings?tab=subscription">
              <Button 
                variant="outline" 
                className="w-full"
                data-testid="button-upgrade-storage"
              >
                Upgrade to Gym Pro (3GB)
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
