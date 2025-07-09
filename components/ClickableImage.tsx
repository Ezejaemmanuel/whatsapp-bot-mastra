import React from 'react';
import Image from 'next/image';
import { ZoomIn } from 'lucide-react';
import { openImageDialog } from '@/lib/store';

interface ClickableImageProps {
    src: string | undefined;
    alt: string;
    title?: string;
    width?: number;
    height?: number;
    className?: string;
    priority?: boolean;
}

export const ClickableImage: React.FC<ClickableImageProps> = ({
    src,
    alt,
    title,
    width = 500,
    height = 300,
    className = '',
    priority = false,
}) => {
    const handleClick = () => {
        if (!src) return;
        console.log('Image clicked:', src);
        openImageDialog(src, title || alt);
    };

    if (!src) {
        return null;
    }

    return (
        <div
            className="relative group cursor-pointer rounded-md overflow-hidden"
            onClick={handleClick}
        >
            <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                className={`rounded-md max-w-full h-auto transition-transform duration-200 group-hover:scale-105 ${className}`}
                priority={priority}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
        </div>
    );
}; 