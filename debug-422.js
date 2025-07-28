#!/usr/bin/env node

const TwoChatAPI = require('./src/services/2chatApi');
const readline = require('readline');

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

async function debug422() {
  console.log('🔧 2Chat API 422 Error Debug Tool\n');
  
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

    console.log('\n📱 Step 1: Testing group listing...');
    console.log('=' .repeat(50));
    
    // Test group listing
    try {
      const groups = await api.listGroups(phoneNumber);
      console.log(`✅ Successfully listed ${groups.length} groups`);
      
      if (groups.length === 0) {
        console.log('❌ No groups found for this phone number');
        console.log('💡 This might be the issue - you need groups to test message fetching');
        rl.close();
        return;
      }

      console.log('\n📋 Available groups:');
      groups.forEach((group, index) => {
        console.log(`${index + 1}. ${group.wa_group_name || 'Unnamed Group'}`);
        console.log(`   UUID: ${group.uuid}`);
        console.log(`   Subject: ${group.wa_subject || 'No subject'}`);
        console.log(`   Size: ${group.size} participants`);
        console.log(`   Created: ${group.wa_created_at}`);
        console.log('');
      });

      // Test message fetching for first group
      const testGroup = groups[0];
      console.log(`\n📱 Step 2: Testing message fetching for "${testGroup.wa_group_name}"...`);
      console.log('=' .repeat(50));
      
      try {
        console.log(`🔍 Testing with UUID: ${testGroup.uuid}`);
        const messages = await api.getGroupMessages(testGroup.uuid, 0);
        console.log(`✅ Successfully fetched ${messages.messages.length} messages from page 0`);
        
        if (messages.messages.length > 0) {
          console.log('\n📝 Sample message:');
          const sampleMessage = messages.messages[0];
          console.log(`   Text: ${sampleMessage.message?.text || 'No text'}`);
          console.log(`   From: ${sampleMessage.participant?.phone_number || 'Unknown'}`);
          console.log(`   Time: ${sampleMessage.created_at || 'Unknown'}`);
        }
        
      } catch (error) {
        console.log(`❌ Error fetching messages: ${error.message}`);
        
        if (error.message.includes('422')) {
          console.log('\n🔍 422 Error Analysis:');
          console.log('   - This usually means the group UUID is invalid or inaccessible');
          console.log('   - Possible causes:');
          console.log('     1. The group was deleted or you were removed');
          console.log('     2. The UUID format is incorrect');
          console.log('     3. Your API key doesn\'t have permission for this group');
          console.log('     4. The group is too old and messages are not accessible');
          console.log('\n💡 Try testing with a different group or check your API permissions');
        }
      }

    } catch (error) {
      console.log(`❌ Error listing groups: ${error.message}`);
      
      if (error.message.includes('401')) {
        console.log('\n🔍 401 Error Analysis:');
        console.log('   - Authentication failed');
        console.log('   - Check your API key in the .env file');
        console.log('   - Verify the API key is valid and active');
      } else if (error.message.includes('404')) {
        console.log('\n🔍 404 Error Analysis:');
        console.log('   - Phone number not found');
        console.log('   - Verify the phone number is connected to 2Chat');
        console.log('   - Check if the number format is correct');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  } finally {
    console.log('\n🔧 Debug completed. Check the logs above for issues.');
    rl.close();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Debug session ended');
  rl.close();
  process.exit(0);
});

debug422().catch(console.error); 