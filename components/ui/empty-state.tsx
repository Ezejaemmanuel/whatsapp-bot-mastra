import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    title: string;
    message: string;
    icon?: React.ReactNode;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, message, icon, className }) => {
    return (
        <div className={cn("flex items-center justify-center h-full bg-transparent", className)}>
            <Card className="w-full max-w-sm mx-auto bg-white/5 backdrop-blur-lg border-2 border-gray-200/10 shadow-xl rounded-2xl">
                <CardHeader className="text-center pt-8">
                    {icon && (
                        <div className="flex justify-center mb-6 text-whatsapp-text-muted">
                            {React.cloneElement(icon as React.ReactElement<any>, {
                                className: 'w-16 h-16',
                            })}
                        </div>
                    )}
                    <CardTitle className="text-2xl font-medium text-whatsapp-text-primary">{title}</CardTitle>
                </CardHeader>
                <CardContent className="pb-8">
                    <p className="text-center text-whatsapp-text-secondary px-4">{message}</p>
                </CardContent>
            </Card>
        </div>
    );
}; 