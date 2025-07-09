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
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/90 border-none">
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
                <div className="flex items-center justify-center w-full h-full p-4">
                    {imageDialog.imageUrl && (
                        <Image
                            src={imageDialog.imageUrl}
                            alt={imageDialog.title || 'Full Size Image'}
                            width={1200}
                            height={800}
                            className="max-w-full max-h-full object-contain rounded-lg"
                            priority
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}; 