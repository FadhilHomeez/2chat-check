# Troubleshooting Guide

## 🔧 Common Issues and Solutions

### 1. 422 Error - "Unprocessable Entity"

**Symptoms:**
- `Request failed with status code 422`
- `Error fetching group messages: Request failed with status code 422`

**Causes:**
1. **Invalid Group UUID** - The group UUID might be corrupted or invalid
2. **Access Denied** - You may not have permission to access this group's messages
3. **Group Deleted** - The group might have been deleted or you were removed
4. **Old Group** - Very old groups might not have accessible message history
5. **API Limitations** - Some groups might be restricted by 2Chat's API

**Solutions:**

#### A. Use the Debug Tool
```bash
npm run debug
```
This will help identify the exact issue with your specific groups.

#### B. Check Group Access
1. Verify the group still exists in your WhatsApp
2. Ensure you're still a member of the group
3. Try with a different, more recent group

#### C. Test Individual Groups
```bash
# List groups first
curl -X GET "http://localhost:3000/api/chat/groups/+YOUR_PHONE_NUMBER"

# Then test specific group
curl -X GET "http://localhost:3000/api/chat/groups/GROUP_UUID/messages"
```

#### D. Check API Permissions
- Verify your 2Chat API key has the necessary permissions
- Contact 2Chat support if you believe it's a permission issue

### 2. 401 Error - "Unauthorized"

**Symptoms:**
- `Authentication failed (401): Please check your API key`

**Solutions:**
1. **Check API Key** - Verify your API key in the `.env` file
2. **Regenerate Key** - Generate a new API key from 2Chat dashboard
3. **Check Format** - Ensure no extra spaces or characters in the key

### 3. 404 Error - "Not Found"

**Symptoms:**
- `Phone number not found`
- `Group not found (404)`

**Solutions:**
1. **Verify Phone Number** - Ensure it's connected to 2Chat
2. **Check Format** - Use international format: `+1234567890`
3. **Wait for Sync** - New connections take 5-30 minutes to sync

### 4. No Groups Found

**Symptoms:**
- `No groups found for this phone number`

**Solutions:**
1. **Check WhatsApp Groups** - Ensure you have groups in WhatsApp
2. **Wait for Sync** - Groups take time to appear after connecting
3. **Refresh Connection** - Reconnect your number to 2Chat

### 5. Empty Chat History

**Symptoms:**
- Groups found but no messages retrieved

**Solutions:**
1. **Check Group Activity** - Ensure the group has recent messages
2. **Verify Connection Time** - Only messages after 2Chat connection are available
3. **Try Different Groups** - Test with more active groups

## 🛠️ Debug Tools

### 1. Setup Test
```bash
npm run test-setup
```
Checks your configuration and API key.

### 2. Debug Tool
```bash
npm run debug
```
Interactive tool to test groups and identify issues.

### 3. CLI Tool
```bash
npm run cli
```
Interactive interface with detailed logging.

## 📋 Step-by-Step Debugging

### Step 1: Verify Configuration
```bash
npm run test-setup
```

### Step 2: Test Group Listing
```bash
curl -X GET "http://localhost:3000/api/chat/groups/+YOUR_PHONE_NUMBER"
```

### Step 3: Test Individual Group
```bash
curl -X GET "http://localhost:3000/api/chat/groups/GROUP_UUID/messages"
```

### Step 4: Use Debug Tool
```bash
npm run debug
```

## 🔍 Understanding Error Types

| Error Code | Meaning | Common Cause |
|------------|---------|--------------|
| 401 | Unauthorized | Invalid API key |
| 404 | Not Found | Phone/group not found |
| 422 | Unprocessable Entity | Invalid request/access denied |
| 403 | Forbidden | Insufficient permissions |
| 500 | Server Error | 2Chat API issue |

## 📞 Getting Help

### 1. Check Logs
Look for detailed error messages in the console output.

### 2. Test with Different Data
- Try different phone numbers
- Test with different groups
- Use the debug tool

### 3. Contact Support
- **2Chat API Issues**: Contact 2Chat support
- **Application Issues**: Check this troubleshooting guide
- **Configuration Issues**: Verify your setup

## 💡 Best Practices

1. **Start Small** - Test with one group first
2. **Use Recent Groups** - Older groups may have limited access
3. **Check Permissions** - Ensure your API key has message access
4. **Monitor Logs** - Watch console output for detailed errors
5. **Test Incrementally** - Use the debug tool step by step

## 🔄 Common Workarounds

### For 422 Errors:
1. Try different groups
2. Use groups with recent activity
3. Check if you're still a member
4. Verify group UUID format

### For Empty Results:
1. Wait for 2Chat to sync (5-30 minutes)
2. Try groups with recent messages
3. Check connection status in 2Chat dashboard 