import { useState, useRef, useEffect } from 'react';
import { Share2, Twitter, Facebook, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface SocialShareButtonProps {
  note: {
    id: string;
    title: string;
    content: string;
    createdAt: string;
  };
  userBelt?: string;
  userStripes?: number;
}

export default function SocialShareButton({ note, userBelt, userStripes }: SocialShareButtonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const [supportsWebShare, setSupportsWebShare] = useState(false);

  useEffect(() => {
    // Check if Web Share API is supported
    setSupportsWebShare(!!navigator.share);
  }, []);

  const generateShareImage = async (): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Instagram Post size (1080x1080)
      canvas.width = 1080;
      canvas.height = 1080;

      // Background - Navy gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, 1080);
      gradient.addColorStop(0, '#1e3a8a'); // Navy blue
      gradient.addColorStop(1, '#0f172a'); // Dark navy
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1080);

      // Add subtle pattern overlay
      ctx.globalAlpha = 0.05;
      for (let i = 0; i < 1080; i += 30) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(1080, i);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Logo/Brand area - Top section
      ctx.fillStyle = 'rgba(220, 38, 38, 0.9)'; // Red accent
      ctx.fillRect(0, 0, 1080, 180);

      // Brand Text - "BJJ JITS JOURNAL"
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BJJ JITS JOURNAL', 540, 70);
      
      // Subtitle
      ctx.font = '32px Arial, sans-serif';
      ctx.fillStyle = '#fecaca'; // Light red
      ctx.fillText('Training Notes & Progress', 540, 130);

      // Belt badge if available
      if (userBelt) {
        const beltY = 250;
        const beltColors: { [key: string]: string } = {
          white: '#f8fafc',
          blue: '#3b82f6',
          purple: '#a855f7',
          brown: '#92400e',
          black: '#0f172a'
        };
        
        ctx.fillStyle = beltColors[userBelt.toLowerCase()] || '#6b7280';
        ctx.fillRect(80, beltY, 180, 60);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(userBelt.toUpperCase(), 100, beltY + 40);
        
        // Stripes
        if (userStripes && userStripes > 0) {
          ctx.fillStyle = '#fbbf24'; // Gold
          for (let i = 0; i < Math.min(userStripes, 4); i++) {
            ctx.fillRect(280 + (i * 25), beltY + 15, 15, 30);
          }
        }
      }

      // Note title - Main content
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px Arial, sans-serif';
      ctx.textAlign = 'center';
      
      // Word wrap title
      const maxWidth = 950;
      const words = note.title.split(' ');
      let line = '';
      let y = userBelt ? 400 : 300;
      
      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && line !== '') {
          ctx.fillText(line, 540, y);
          line = word + ' ';
          y += 60;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 540, y);

      // Note content preview (first 150 chars)
      const contentPreview = note.content.substring(0, 150) + (note.content.length > 150 ? '...' : '');
      ctx.font = '32px Arial, sans-serif';
      ctx.fillStyle = '#cbd5e1'; // Light gray
      
      // Word wrap content
      const contentWords = contentPreview.split(' ');
      line = '';
      y += 100;
      let lineCount = 0;
      const maxLines = 4;
      
      for (const word of contentWords) {
        if (lineCount >= maxLines) break;
        
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && line !== '') {
          ctx.fillText(line, 540, y);
          line = word + ' ';
          y += 45;
          lineCount++;
        } else {
          line = testLine;
        }
      }
      if (lineCount < maxLines && line !== '') {
        ctx.fillText(line, 540, y);
      }

      // Date at bottom
      const date = new Date(note.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      
      ctx.fillStyle = '#94a3b8';
      ctx.font = '28px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(date, 540, 980);

      // Bottom accent line
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 1020, 1080, 60);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Arial';
      ctx.fillText('Track Your Journey • Share Your Progress', 540, 1060);

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/png');
    });
  };

  const handleWebShare = async () => {
    try {
      const imageBlob = await generateShareImage();
      const file = new File([imageBlob], 'bjj-journal-note.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `BJJ Training Note: ${note.title}`,
          text: `${note.title}\n\n${note.content.substring(0, 100)}...`
        });
        
        toast({
          title: 'Shared!',
          description: 'Your note has been shared successfully.',
        });
      } else {
        // Fallback to download
        handleDownload();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
        toast({
          title: 'Share cancelled',
          description: 'You can download the image instead.',
        });
      }
    }
  };

  const handleDownload = async () => {
    const imageBlob = await generateShareImage();
    const url = URL.createObjectURL(imageBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bjj-journal-${note.title.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Downloaded!',
      description: 'Image saved to your device.',
    });
  };

  const handleTwitterShare = () => {
    const text = `${note.title}\n\nTracking my BJJ journey with Jits Journal! 🥋`;
    // Always use production URL for social sharing (works on mobile too)
    const url = 'https://bjj-jits-journal.onrender.com';
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const handleFacebookShare = () => {
    // Always use production URL for social sharing (works on mobile too)
    const url = 'https://bjj-jits-journal.onrender.com';
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  return (
    <>
      {/* Hidden canvas for image generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {supportsWebShare ? (
        // Mobile: Single share button with Web Share API
        <Button
          onClick={handleWebShare}
          variant="outline"
          size="sm"
          className="gap-2"
          data-testid="button-share-note"
        >
          <Share2 className="w-4 h-4" />
          Share to Social Media
        </Button>
      ) : (
        // Desktop: Dropdown with share options
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              data-testid="button-share-note"
            >
              <Share2 className="w-4 h-4" />
              Share to Social Media
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleTwitterShare} data-testid="button-share-twitter">
              <Twitter className="w-4 h-4 mr-2" />
              Share on Twitter
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleFacebookShare} data-testid="button-share-facebook">
              <Facebook className="w-4 h-4 mr-2" />
              Share on Facebook
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownload} data-testid="button-download-image">
              <Download className="w-4 h-4 mr-2" />
              Download Image
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}
