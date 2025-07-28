# 2Chat Chat Checker

A backend application that uses the 2Chat API to search WhatsApp groups by phone number and export chat history in JSON format.

## Features

- 🔍 List all WhatsApp groups for a given phone number
- 📝 Get chat history for specific groups
- 🔎 Search groups by title and retrieve chat history
- 💾 Export chat history to JSON files
- 📊 Pagination support for large chat histories
- 🛡️ Input validation and error handling

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- 2Chat API key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd 2chat-chat-checker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

4. Edit the `.env` file and add your 2Chat API key:
```env
API_KEY=your_2chat_api_key_here
API_BASE_URL=https://api.p.2chat.io/open
PORT=3000
NODE_ENV=development
```

## Usage

### Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Web Interface

Once the server is running, you can access the web interface at:
```
http://localhost:3000
```

The web interface provides:
- **Search Form** - Enter phone number (optional) and group title
- **Auto-Search** - Leave phone number empty to search all predefined numbers
- **Groups List** - View all found groups with message counts
- **Chat Viewer** - Browse messages in each group
- **Export Options** - Download individual groups or all data as JSON
- **Demo Mode** - Try the interface with sample data

### Command Line Interface

For command-line usage:
```bash
npm run cli
```

## API Endpoints

### 1. List WhatsApp Groups
**GET** `/api/chat/groups/:phoneNumber`

Lists all WhatsApp groups for a given phone number.

**Example:**
```bash
curl -X GET "http://localhost:3000/api/chat/groups/+1234567890"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "phoneNumber": "+1234567890",
    "groupsCount": 2,
    "groups": [
      {
        "uuid": "WAG768beeef-2b96-4bc7-9b7f-045078568723",
        "wa_group_name": "Test Group",
        "wa_subject": "Group description",
        "size": 4,
        "wa_created_at": "2022-10-23T17:11:41Z"
      }
    ]
  }
}
```

### 2. Get Chat History
**GET** `/api/chat/groups/:groupUuid/messages`

Retrieves chat history for a specific group.

**Query Parameters:**
- `maxPages` (optional): Maximum number of pages to fetch (default: 10)
- `export` (optional): Set to "true" to save to JSON file

**Example:**
```bash
curl -X GET "http://localhost:3000/api/chat/groups/WAG768beeef-2b96-4bc7-9b7f-045078568723/messages?export=true"
```

### 3. Search Groups by Title
**POST** `/api/chat/search`

Search for groups by title and get their chat history.

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "groupTitle": "test",
  "maxPages": 10,
  "export": true
}
```

**Example:**
```bash
curl -X POST "http://localhost:3000/api/chat/search" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "groupTitle": "test",
    "export": true
  }'
```

### 4. Search All Predefined Numbers
**POST** `/api/chat/search-all`

Search all predefined phone numbers for groups and chat history.

**Request Body:**
```json
{
  "groupTitle": "test",
  "maxPages": 10,
  "export": true
}
```

**Example:**
```bash
curl -X POST "http://localhost:3000/api/chat/search-all" \
  -H "Content-Type: application/json" \
  -d '{
    "groupTitle": "test",
    "export": true
  }'
```

**Note:** This endpoint automatically searches through all predefined phone numbers when no specific number is provided.

## File Exports

When using the `export` parameter, chat history will be saved to the `exports/` directory with the following naming convention:

- Individual group: `chat-history-{groupUuid}-{timestamp}.json`
- Search results: `search-results-{sanitizedTitle}-{timestamp}.json`

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common error scenarios:
- Invalid phone number format
- Missing required parameters
- API authentication errors
- Group not found

## Development

### Project Structure
```
├── src/
│   ├── config/
│   │   └── config.js          # Configuration management
│   ├── controllers/
│   │   └── chatController.js  # API endpoint handlers
│   ├── middleware/
│   │   └── errorHandler.js    # Error handling middleware
│   ├── routes/
│   │   └── chatRoutes.js      # Express routes
│   └── services/
│       └── 2chatApi.js        # 2Chat API integration
├── exports/                   # Generated JSON files
├── index.js                   # Main application file
├── package.json
└── README.md
```

### Adding New Features

1. **New API Endpoint**: Add method to `ChatController` and route to `chatRoutes.js`
2. **New Service**: Create service class in `services/` directory
3. **Configuration**: Add to `config.js` if needed

## Troubleshooting

### Common Issues

1. **API Key Error**: Ensure your 2Chat API key is correctly set in `.env`
2. **Phone Number Format**: Use international format (e.g., +1234567890)
3. **Group Not Found**: Verify the group UUID exists for the phone number
4. **Rate Limiting**: 2Chat API may have rate limits; implement delays if needed

### Logs

The application logs all requests and errors. Check the console output for debugging information.

## License

MIT License

## Support

For issues related to:
- **2Chat API**: Contact 2Chat support
- **This Application**: Create an issue in the repository 