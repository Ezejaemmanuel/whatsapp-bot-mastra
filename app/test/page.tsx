import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function TestHome() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="container mx-auto px-4 py-8">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                            <div className="relative bg-primary/10 p-4 rounded-full border border-primary/20">
                                <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        WhatsApp Bot with Mastra
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Experience the power of real-time messaging with our advanced WhatsApp bot powered by Convex database and Mastra AI
                    </p>
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <Badge variant="secondary" className="text-sm">
                            🚀 Real-time
                        </Badge>
                        <Badge variant="secondary" className="text-sm">
                            🤖 AI Powered
                        </Badge>
                        <Badge variant="secondary" className="text-sm">
                            📱 WhatsApp Ready
                        </Badge>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/50">
                        <CardHeader>
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <CardTitle className="text-lg">Real-time Processing</CardTitle>
                            <CardDescription>
                                Lightning-fast message processing with Convex real-time database
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/50">
                        <CardHeader>
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <CardTitle className="text-lg">Media Handling</CardTitle>
                            <CardDescription>
                                Advanced media file processing with secure cloud storage
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/50">
                        <CardHeader>
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                            </div>
                            <CardTitle className="text-lg">User Management</CardTitle>
                            <CardDescription>
                                Comprehensive user and conversation tracking system
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/50">
                        <CardHeader>
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <CardTitle className="text-lg">Analytics Dashboard</CardTitle>
                            <CardDescription>
                                Real-time monitoring and comprehensive analytics
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/50">
                        <CardHeader>
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 4.828A4 4 0 015.5 4H9v1H5.5a3 3 0 00-2.121.879l-.707-.707zM9 12v1H4.5A2.5 2.5 0 012 10.5V9h1v1.5A1.5 1.5 0 004.5 12H9z" />
                                </svg>
                            </div>
                            <CardTitle className="text-lg">Webhook Monitoring</CardTitle>
                            <CardDescription>
                                Advanced logging and real-time webhook monitoring
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/50">
                        <CardHeader>
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <CardTitle className="text-lg">AI Integration</CardTitle>
                            <CardDescription>
                                Powered by Mastra AI for intelligent conversations
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-12">
                    <Button asChild size="lg" className="group">
                        <Link href="/test/dashboard">
                            <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Launch Dashboard
                        </Link>
                    </Button>
                    <Button variant="outline" size="lg" asChild>
                        <a href="https://docs.convex.dev" target="_blank" rel="noopener noreferrer">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            Documentation
                        </a>
                    </Button>
                </div>

                {/* Getting Started Section */}
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Quick Start Guide
                        </CardTitle>
                        <CardDescription>
                            Get your WhatsApp bot up and running in minutes
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                                        1
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Configure Credentials</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Set up your WhatsApp Business API credentials in your environment variables
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                                        2
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Setup Webhook</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Configure your webhook URL in the Meta Developer Console
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                                        3
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Test Integration</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Send a message to your WhatsApp Business number to verify the setup
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                                        4
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Monitor Activity</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Use the dashboard to monitor conversations and analytics
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Separator className="my-12" />

                {/* Footer */}
                <footer className="text-center">
                    <div className="flex flex-wrap items-center justify-center gap-6 mb-6">
                        <a
                            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                            href="https://github.com/mastra-ai/mastra"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Image
                                aria-hidden
                                src="/file.svg"
                                alt="File icon"
                                width={16}
                                height={16}
                            />
                            Mastra AI
                        </a>
                        <a
                            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                            href="https://convex.dev"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Image
                                aria-hidden
                                src="/window.svg"
                                alt="Window icon"
                                width={16}
                                height={16}
                            />
                            Convex Database
                        </a>
                        <a
                            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                            href="https://developers.facebook.com/docs/whatsapp"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Image
                                aria-hidden
                                src="/globe.svg"
                                alt="Globe icon"
                                width={16}
                                height={16}
                            />
                            WhatsApp API
                        </a>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Built with ❤️ using Next.js, Convex, and Mastra AI
                    </p>
                </footer>
            </div>
        </div>
    );
}
