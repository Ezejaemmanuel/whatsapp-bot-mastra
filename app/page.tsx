import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="text-center sm:text-left">
          <h1 className="text-4xl font-bold mb-4">WhatsApp Bot with Mastra</h1>
          <p className="text-xl text-gray-600 mb-6">
            Powered by Convex real-time database
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl">
          <h2 className="text-2xl font-semibold mb-4">Features</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Real-time message processing with Convex
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Media file handling with Convex file storage
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              User and conversation management
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Webhook logging and monitoring
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Interactive dashboard with live data
            </li>
          </ul>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link
            href="/dashboard"
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Dashboard
          </Link>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
            href="https://docs.convex.dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            Convex Docs
          </a>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg max-w-2xl">
          <h3 className="text-lg font-semibold mb-3">Getting Started</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Configure your WhatsApp Business API credentials in <code className="bg-gray-200 px-1 py-0.5 rounded">.env.local</code></li>
            <li>Set up your webhook URL in Meta Developer Console</li>
            <li>Send a message to your WhatsApp Business number to test</li>
            <li>Monitor activity in the <Link href="/dashboard" className="text-blue-600 hover:underline">dashboard</Link></li>
          </ol>
        </div>
      </main>

      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
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
          Mastra
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
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
          Convex
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
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
      </footer>
    </div>
  );
}
