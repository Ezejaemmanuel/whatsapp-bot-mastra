import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">WhatsApp Bot</h1>
        <p className="text-muted-foreground mb-6">
          Visit the test interface or chat directly with the AI assistant
        </p>
        <div className="space-x-4">
          <Link
            href="/test"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Go to Test Interface
          </Link>
          <Link
            href="/chat"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Chat with AI Assistant
          </Link>
        </div>
      </div>
    </div>
  );
}
