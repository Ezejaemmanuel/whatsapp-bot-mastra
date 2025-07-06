# Khaliwid Bot - WhatsApp Chat Interface

A fully functional WhatsApp-like chat interface built with Next.js, Convex, and Zustand for real-time messaging and state management.

## 🚀 Features

### ✅ Completed Features
- **Real-time Chat Interface**: WhatsApp-like design with dark theme
- **Convex Database Integration**: Real-time database for conversations, messages, users, and transactions
- **Zustand State Management**: Centralized state management for UI and data
- **Mobile Responsive Design**: Works seamlessly on desktop and mobile
- **Bot Integration**: "Khaliwid Bot" for automated responses
- **Admin Support**: Admin can take over conversations from bot
- **Message Sending/Receiving**: Real-time message exchange
- **Conversation Management**: List view with last message preview and timestamps
- **User Management**: Track users, phone numbers, and bank details
- **Transaction Support**: Exchange rate management and transaction tracking
- **Media File Support**: Infrastructure for handling images, documents, etc.
- **WhatsApp Styling**: Authentic WhatsApp dark theme with proper colors and layout

### 🎨 UI Components
- **ChatList**: Conversation list with search, filters, and unread indicators
- **ChatView**: Message display with bubbles, timestamps, and read receipts
- **SideNavigation**: Tab navigation for chats, transactions, and settings
- **TransactionList**: Transaction management interface
- **WhatsAppLayout**: Main layout component with responsive design

### 🗄️ Database Schema
- **Users**: WhatsApp IDs, profiles, phone numbers, bank details
- **Conversations**: Chat sessions with status and ownership (bot/admin)
- **Messages**: All message types with metadata and status
- **Transactions**: Currency exchange transactions with rates and status
- **Exchange Rates**: Real-time currency rates with min/max boundaries
- **Media Files**: File storage with Convex integration
- **Admin Bank Details**: Payment receiving accounts

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Database**: Convex (real-time database)
- **State Management**: Zustand
- **UI Components**: Radix UI, Tailwind CSS
- **Icons**: Lucide React
- **Package Manager**: pnpm

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- Convex account

### Installation

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up Convex**:
   ```bash
   npx convex dev
   ```
   Follow the prompts to create a Convex project and get your deployment URL.

3. **Environment Variables**:
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
   ```

4. **Seed the database**:
   Navigate to `/test` page and click "Seed Database with Sample Data"

5. **Start development server**:
   ```bash
   pnpm dev
   ```

6. **Open the app**:
   Visit `http://localhost:3000` to see the chat interface

## 📱 Usage

### Testing the Chat Interface

1. **Visit the Test Page**: Go to `/test` to access the testing interface
2. **Seed Database**: Click "Seed Database with Sample Data" to populate with sample conversations
3. **Launch Chat**: Click "Launch Chat Interface" to open the full WhatsApp-like interface

### Navigation

- **Chats Tab**: View and manage conversations
- **Transactions Tab**: Handle currency exchange transactions
- **Settings Tab**: Configuration options (coming soon)

### Chat Features

- **Select Conversations**: Click on any conversation in the left panel
- **Send Messages**: Type and send messages as an admin
- **Real-time Updates**: Messages appear instantly
- **Mobile Support**: Responsive design works on all devices

## 🏗️ Architecture

### State Management (Zustand)

```typescript
// Centralized store with:
- UI State (selected conversation, mobile mode, search, filters)
- Data State (users, conversations, messages, transactions)
- Actions (setters, selectors, computed values)
```

### Convex Integration

```typescript
// Real-time queries and mutations:
- useQuery for fetching data
- useMutation for updates
- Automatic real-time updates
- Optimistic updates support
```

### Component Structure

```
WhatsAppLayout
├── SideNavigation (tabs)
├── ChatList (conversations)
│   ├── Search & Filters
│   ├── Conversation Items
│   └── Mobile Navigation
└── ChatView (messages)
    ├── Header (user info)
    ├── Messages Area
    └── Input Area
```

## 🎨 Styling

### WhatsApp Theme Colors

```css
/* Dark theme with authentic WhatsApp colors */
--whatsapp-primary: #25D366 (WhatsApp Green)
--whatsapp-bg: #111111 (Main background)
--whatsapp-chat-bg: #0a0a0a (Chat area)
--whatsapp-panel-bg: #1f1f1f (Side panels)
--whatsapp-message-bg: #262626 (Incoming messages)
--whatsapp-message-out: #25D366 (Outgoing messages)
```

### Responsive Design

- **Desktop**: Three-column layout (navigation, list, chat)
- **Mobile**: Single-view navigation with back buttons
- **Tablet**: Adaptive layout based on screen size

## 🔧 Development

### Adding New Features

1. **Database Changes**: Update `convex/schema.ts`
2. **State Management**: Extend the Zustand store in `lib/store.ts`
3. **UI Components**: Create/modify components in `components/`
4. **Convex Functions**: Add queries/mutations in `convex/`

### Key Files

- `lib/store.ts` - Zustand state management
- `convex/schema.ts` - Database schema
- `components/WhatsAppLayout.tsx` - Main layout
- `components/ChatView.tsx` - Message interface
- `components/ChatList.tsx` - Conversation list
- `convex/seedData.ts` - Sample data for testing

## 🧪 Testing

### Sample Data

The seed function creates:
- 5 sample users (including Khaliwid Bot)
- 4 conversations with different scenarios
- 20+ sample messages showing various conversation flows
- Sample exchange rates and transactions
- Admin bank details

### Test Scenarios

1. **Bot Conversations**: Automated currency exchange flows
2. **Admin Takeover**: Admin handling customer support
3. **Transaction Management**: Exchange rate negotiations
4. **Real-time Updates**: Message sending and receiving

## 🚀 Deployment

### Production Deployment

1. **Deploy Convex**:
   ```bash
   npx convex deploy
   ```

2. **Deploy to Vercel/Netlify**:
   ```bash
   pnpm build
   ```

3. **Environment Variables**:
   Set `NEXT_PUBLIC_CONVEX_URL` in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🎯 Next Steps

### Planned Features
- [ ] Real WhatsApp API integration
- [ ] Voice message support
- [ ] Image/document sharing
- [ ] Group chat support
- [ ] Advanced admin dashboard
- [ ] Analytics and reporting
- [ ] Webhook management
- [ ] Rate limiting and security
- [ ] Multi-language support
- [ ] Dark/light theme toggle

### Integration Opportunities
- [ ] Mastra AI for intelligent responses
- [ ] Payment gateway integration
- [ ] OCR for receipt processing
- [ ] Real-time notifications
- [ ] Export/import functionality

---

**Built with ❤️ for seamless WhatsApp business communication** 