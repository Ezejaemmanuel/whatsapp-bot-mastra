import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send } from 'lucide-react';

interface ImagePreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File | null;
  onSend: (caption: string) => Promise<void>;
  onCancel: () => void;
}

export const ImagePreviewDialog: React.FC<ImagePreviewDialogProps> = ({
  isOpen,
  onOpenChange,
  imageFile,
  onSend,
  onCancel,
}) => {
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);

      // Cleanup
      return () => {
        URL.revokeObjectURL(url);
        setPreviewUrl(null);
      };
    }
  }, [imageFile]);

  const handleSendClick = async () => {
    setIsSending(true);
    try {
      await onSend(caption);
    } catch (error) {
      // The parent component will show a toast, but we can log here.
      console.error("Failed to send image from dialog", error);
    } finally {
      setIsSending(false);
      // The parent will close the dialog on success.
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && !isSending) {
        onCancel();
    }
    onOpenChange(open);
  }

  // Reset caption when dialog re-opens with a new file
  useEffect(() => {
    if (isOpen) {
        setCaption('');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[425px] md:max-w-lg lg:max-w-2xl bg-whatsapp-panel-bg glass-panel border-whatsapp-border/50 text-whatsapp-text-primary">
        <DialogHeader>
          <DialogTitle>Preview Image</DialogTitle>
          <DialogDescription>
            Add a caption and send the image, or cancel.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden ring-1 ring-whatsapp-border/30">
            {previewUrl && (
              <Image
                src={previewUrl}
                alt="Image preview"
                layout="fill"
                objectFit="contain"
              />
            )}
          </div>
          <Input
            id="caption"
            placeholder="Add a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="whatsapp-input"
            disabled={isSending}
            onKeyPress={(e) => {
                if (e.key === 'Enter' && !isSending) {
                    handleSendClick();
                }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSendClick} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 