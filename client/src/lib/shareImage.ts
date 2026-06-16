import html2canvas from 'html2canvas';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

interface ShareImageOptions {
  title?: string;
  text?: string;
  fileName?: string;
}

/**
 * Render a DOM element to a PNG and share it.
 * - Native (Android/iOS): writes the image to the device cache, then opens the
 *   OS share sheet via the Capacitor Share plugin.
 * - Web: uses the Web Share API when it supports files, otherwise downloads.
 */
export async function shareElementAsImage(
  element: HTMLElement,
  options: ShareImageOptions = {}
): Promise<void> {
  const {
    title = 'My BJJ Stats — Jits Journal',
    text = 'Check out my BJJ training stats from Jits Journal! 🥋',
    fileName = 'jits-journal-stats',
  } = options;

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
    });

    // Native (Android/iOS): write the image to the device, then share via the OS sheet.
    if (Capacitor.isNativePlatform()) {
      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1];
      const filePath = `${fileName}-${Date.now()}.png`;

      const written = await Filesystem.writeFile({
        path: filePath,
        data: base64,
        directory: Directory.Cache,
      });

      await Share.share({
        title,
        text,
        files: [written.uri],
      });
      return;
    }

    // Web: use the Web Share API if it supports files, otherwise download.
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png')
    );
    if (!blob) return;

    const file = new File([blob], `${fileName}.png`, { type: 'image/png' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (err: any) {
    // User cancelling the share sheet throws — don't treat that as an error.
    if (err?.message?.includes('cancel') || err?.message?.includes('Abort')) return;
    console.error('Share failed:', err);
  }
}
