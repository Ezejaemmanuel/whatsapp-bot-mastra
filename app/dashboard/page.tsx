import Link from "next/link";

export default function Dashboard() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
                <p className="text-muted-foreground mb-6">
                    Visit the test dashboard to view the full interface
                </p>
                <Link
                    href="/test/dashboard"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                >
                    Go to Test Dashboard
                </Link>
            </div>
        </div>
    );
}