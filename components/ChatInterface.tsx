'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
}

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            content: inputMessage.trim(),
            role: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMessage.content }),
            });

            const data = await response.json();

            if (data.success) {
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    content: data.message,
                    role: 'assistant',
                    timestamp: new Date(),
                };

                setMessages(prev => [...prev, assistantMessage]);
            } else {
                const errorMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    content: `Error: ${data.error}`,
                    role: 'assistant',
                    timestamp: new Date(),
                };

                setMessages(prev => [...prev, errorMessage]);
            }
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: 'Failed to send message. Please try again.',
                role: 'assistant',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([]);
    };

    return (
        <Card className="w-full max-w-4xl mx-auto h-[80vh] flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Chat with AI Assistant</CardTitle>
                    <Button variant="outline" onClick={clearChat} disabled={isLoading}>
                        Clear Chat
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col gap-4">
                <ScrollArea className="flex-1 p-4 border rounded-lg">
                    {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            Send a message to start the conversation
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((message, index) => (
                                <div key={message.id}>
                                    <div
                                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                                            }`}
                                    >
                                        <div
                                            className={`max-w-[80%] p-3 rounded-lg ${message.role === 'user'
                                                ? 'bg-primary text-primary-foreground ml-auto'
                                                : 'bg-muted'
                                                }`}
                                        >
                                            <div className="whitespace-pre-wrap">{message.content}</div>
                                            <div className="text-xs opacity-70 mt-1">
                                                {message.timestamp.toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                    {index < messages.length - 1 && <Separator className="my-2" />}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-muted p-3 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            <div className="animate-pulse">Thinking...</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>

                <div className="flex gap-2">
                    <Textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message here..."
                        className="flex-1 resize-none max-h-[120px]"
                        disabled={isLoading}
                    />
                    <Button
                        onClick={sendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        className="px-6"
                    >
                        {isLoading ? 'Sending...' : 'Send'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
