import React from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWhatsAppStore } from '@/lib/store';

export const ImageDialog: React.FC = () => {
    const { ui: { imageDialog }, closeImageDialog } = useWhatsAppStore();

    return (
        <Dialog open={imageDialog.isOpen} onOpenChange={closeImageDialog}>
            <DialogContent className="p-0 bg-black/90 border-none w-screen h-screen max-w-full max-h-full sm:max-w-[95vw] sm:max-h-[95vh] sm:rounded-lg">
                <DialogHeader className="absolute top-4 left-4 right-4 z-10">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-white text-lg">
                            {imageDialog.title || 'Image'}
                        </DialogTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={closeImageDialog}
                            className="text-white hover:bg-white/20"
                        >
                            <X className="w-6 h-6" />
                        </Button>
                    </div>
                </DialogHeader>
                <div className="flex items-center justify-center w-full h-full p-4 pt-16 sm:pt-4">
                    {imageDialog.imageUrl && (
                        <Image
                            src={imageDialog.imageUrl}
                            alt={imageDialog.title || 'Full Size Image'}
                            width={1200}
                            height={800}
                            className="max-w-full max-h-full object-contain"
                            priority
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}; 