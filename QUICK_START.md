# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Setup Environment
```bash
# Copy environment template
cp env.example .env

# Edit .env and add your 2Chat API key
API_KEY=your_2chat_api_key_here
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Test Setup
```bash
npm run test-setup
```

## 📱 Usage Options

### Option A: Web Interface (Recommended)
```bash
npm start
```
Then open: `http://localhost:3000`
- Beautiful, modern UI
- Search by phone number and group title
- Browse groups and messages visually
- Export data with one click
- Demo mode for testing

### Option B: Command Line Interface
```bash
npm run cli
```
- Interactive prompts for phone number and group selection
- Automatic JSON export
- User-friendly interface

### Option C: REST API Server
```bash
npm start
```
Then make requests to:
- `GET http://localhost:3000/api/chat/groups/+1234567890` - List groups
- `GET http://localhost:3000/api/chat/groups/{uuid}/messages?export=true` - Get chat history
- `POST http://localhost:3000/api/chat/search` - Search by group title

### Option D: Development Mode
```bash
npm run dev
```
Auto-restart on file changes

## 🔑 Getting Your 2Chat API Key

1. Sign up at [2Chat](https://2chat.co)
2. Connect your WhatsApp number
3. Go to API settings
4. Generate your API key

## 📋 Example Usage

### CLI Example:
```bash
$ npm run cli
🚀 2Chat Chat Checker CLI

Enter phone number (international format, e.g., +1234567890): +1234567890
📱 Fetching groups for phone number: +1234567890

✅ Found 2 group(s):

1. Test Group
   UUID: WAG768beeef-2b96-4bc7-9b7f-045078568723
   Subject: Group description
   Size: 4 participants
   Created: 2022-10-23T17:11:41Z

Enter group number to get chat history (or "all" for all groups): 1
📥 Fetching chat history for: Test Group
✅ Found 150 messages
✅ Chat history exported to: exports/chat-history-WAG768beeef-2b96-4bc7-9b7f-045078568723-2025-01-03T14-30-00-000Z.json
```

### API Example:
```bash
# List groups
curl -X GET "http://localhost:3000/api/chat/groups/+1234567890"

# Get chat history with export
curl -X GET "http://localhost:3000/api/chat/groups/WAG768beeef-2b96-4bc7-9b7f-045078568723/messages?export=true"

# Search groups by title
curl -X POST "http://localhost:3000/api/chat/search" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "groupTitle": "test",
    "export": true
  }'
```

## 📁 Output Files

All exports are saved to the `exports/` directory:
- `chat-history-{uuid}-{timestamp}.json` - Individual group chat history
- `search-results-{title}-{timestamp}.json` - Search results
- `all-groups-chat-history-{timestamp}.json` - All groups (CLI)

## 🆘 Need Help?

- Check the full [README.md](README.md) for detailed documentation
- Ensure your 2Chat API key is valid and has proper permissions
- Verify phone number format: `+[country code][number]`
- Check the `exports/` directory for generated files

## 🔧 Troubleshooting

**"API_KEY environment variable is required"**
- Create `.env` file from `env.example`
- Add your 2Chat API key

**"No groups found"**
- Verify phone number is connected to 2Chat
- Check API key permissions
- Wait 5-30 minutes after first connection

**"Invalid phone number format"**
- Use international format: `+1234567890`
- Include country code 