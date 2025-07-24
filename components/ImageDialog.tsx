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
            <DialogContent className="p-0 bg-black/95 border-none w-[90vw] h-[85vh] max-w-[1200px] max-h-[800px] sm:rounded-lg backdrop-blur-sm">
                <DialogHeader className="absolute top-4 left-4 right-4 z-10">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-white text-lg font-medium">
                            {imageDialog.title || 'Image'}
                        </DialogTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={closeImageDialog}
                            className="text-white hover:bg-white/20 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </DialogHeader>
                <div className="flex items-center justify-center w-full h-full p-6 pt-16">
                    {imageDialog.imageUrl && (
                        <div className="relative w-full h-full">
                            <Image
                                src={imageDialog.imageUrl}
                                alt={imageDialog.title || 'Full Size Image'}
                                fill
                                className="object-contain rounded-md"
                                priority
                                sizes="(max-width: 768px) 90vw, (max-width: 1200px) 80vw, 1200px"
                            />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};