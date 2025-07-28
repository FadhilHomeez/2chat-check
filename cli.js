#!/usr/bin/env node

const readline = require('readline');
const TwoChatAPI = require('./src/services/2chatApi');
const fs = require('fs').promises;
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const api = new TwoChatAPI();

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🚀 2Chat Chat Checker CLI\n');
  
  try {
    // Get phone number
    const phoneNumber = await question('Enter phone number (international format, e.g., +1234567890): ');
    
    if (!phoneNumber) {
      console.log('❌ Phone number is required');
      rl.close();
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      console.log('❌ Invalid phone number format. Use international format (e.g., +1234567890)');
      rl.close();
      return;
    }

    console.log('\n📱 Fetching groups for phone number:', phoneNumber);
    
    // Get groups
    const groups = await api.listGroups(phoneNumber);
    
    if (groups.length === 0) {
      console.log('❌ No groups found for this phone number');
      rl.close();
      return;
    }

    console.log(`\n✅ Found ${groups.length} group(s):\n`);
    
    groups.forEach((group, index) => {
      console.log(`${index + 1}. ${group.wa_group_name || 'Unnamed Group'}`);
      console.log(`   UUID: ${group.uuid}`);
      console.log(`   Subject: ${group.wa_subject || 'No subject'}`);
      console.log(`   Size: ${group.size} participants`);
      console.log(`   Created: ${group.wa_created_at}`);
      console.log('');
    });

    // Ask for group selection
    const groupChoice = await question('Enter group number to get chat history (or "all" for all groups): ');
    
    if (groupChoice.toLowerCase() === 'all') {
      console.log('\n📥 Fetching chat history for all groups...');
      
      const results = [];
      for (const group of groups) {
        try {
          console.log(`\n📥 Fetching messages for: ${group.wa_group_name}`);
          const messages = await api.getAllGroupMessages(group.uuid, 5); // Limit to 5 pages
          
          results.push({
            group: {
              uuid: group.uuid,
              name: group.wa_group_name,
              subject: group.wa_subject,
              size: group.size,
              created_at: group.wa_created_at
            },
            messagesCount: messages.length,
            messages
          });
          
          console.log(`✅ Found ${messages.length} messages`);
        } catch (error) {
          console.log(`❌ Error fetching messages for ${group.wa_group_name}: ${error.message}`);
        }
      }

      // Export results
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `all-groups-chat-history-${timestamp}.json`;
      const exportPath = path.join(__dirname, 'exports', filename);
      
      await fs.mkdir(path.dirname(exportPath), { recursive: true });
      await fs.writeFile(exportPath, JSON.stringify({
        phoneNumber,
        timestamp: new Date().toISOString(),
        results
      }, null, 2));
      
      console.log(`\n✅ Chat history exported to: ${exportPath}`);
      
    } else {
      const groupIndex = parseInt(groupChoice) - 1;
      
      if (groupIndex < 0 || groupIndex >= groups.length) {
        console.log('❌ Invalid group number');
        rl.close();
        return;
      }

      const selectedGroup = groups[groupIndex];
      console.log(`\n📥 Fetching chat history for: ${selectedGroup.wa_group_name}`);
      
      const messages = await api.getAllGroupMessages(selectedGroup.uuid, 10);
      
      console.log(`✅ Found ${messages.length} messages`);
      
      // Export to file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `chat-history-${selectedGroup.uuid}-${timestamp}.json`;
      const exportPath = path.join(__dirname, 'exports', filename);
      
      await fs.mkdir(path.dirname(exportPath), { recursive: true });
      await fs.writeFile(exportPath, JSON.stringify({
        phoneNumber,
        group: {
          uuid: selectedGroup.uuid,
          name: selectedGroup.wa_group_name,
          subject: selectedGroup.wa_subject,
          size: selectedGroup.size,
          created_at: selectedGroup.wa_created_at
        },
        messagesCount: messages.length,
        messages,
        timestamp: new Date().toISOString()
      }, null, 2));
      
      console.log(`\n✅ Chat history exported to: ${exportPath}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Goodbye!');
  rl.close();
  process.exit(0);
});

main().catch(console.error); 