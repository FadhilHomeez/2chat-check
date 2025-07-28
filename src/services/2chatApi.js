const axios = require('axios');
const config = require('../config/config');

class TwoChatAPI {
  constructor() {
    this.baseURL = config.api.baseUrl;
    this.apiKey = config.api.key;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'X-User-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * List all WhatsApp groups for a given phone number
   * @param {string} phoneNumber - Phone number in international format (e.g., +1234567890)
   * @returns {Promise<Array>} Array of group objects
   */
  async listGroups(phoneNumber) {
    try {
      const response = await this.client.get(`/whatsapp/groups/${phoneNumber}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Failed to fetch groups');
      }
    } catch (error) {
      console.error('Error fetching groups:', error.message);
      throw error;
    }
  }

  /**
   * Get messages from a specific group
   * @param {string} groupUuid - The UUID of the group
   * @param {number} pageNumber - Page number for pagination (default: 0)
   * @returns {Promise<Object>} Messages object with pagination info
   */
  async getGroupMessages(groupUuid, pageNumber = 0) {
    try {
      console.log(`🔍 Fetching messages for group: ${groupUuid}, page: ${pageNumber}`);
      
      const url = `/whatsapp/groups/messages/${groupUuid}?page_number=${pageNumber}`;
      console.log(`📡 API URL: ${this.baseURL}${url}`);
      
      const response = await this.client.get(url);
      
      if (response.data.success) {
        const messageCount = response.data.messages ? response.data.messages.length : 0;
        console.log(`✅ Successfully fetched ${messageCount} messages from page ${pageNumber}`);
        return {
          pageNumber: response.data.page_number,
          messages: response.data.messages || []
        };
      } else {
        throw new Error(`API returned success: false - ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      console.error(`❌ Error fetching group messages for ${groupUuid}:`);
      console.error(`   Status: ${error.response?.status}`);
      console.error(`   Message: ${error.message}`);
      console.error(`   Response: ${JSON.stringify(error.response?.data)}`);
      
      // Handle specific error cases
      if (error.response?.status === 422) {
        throw new Error(`Invalid request (422): The group UUID '${groupUuid}' may be invalid or you may not have access to this group's messages`);
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed (401): Please check your API key');
      } else if (error.response?.status === 404) {
        throw new Error(`Group not found (404): The group UUID '${groupUuid}' does not exist`);
      } else if (error.response?.status === 403) {
        throw new Error('Access denied (403): You may not have permission to access this group\'s messages');
      }
      
      throw error;
    }
  }

  /**
   * Get all messages from a group (handles pagination automatically)
   * @param {string} groupUuid - The UUID of the group
   * @param {number} maxPages - Maximum number of pages to fetch (default: 10)
   * @returns {Promise<Array>} Array of all messages
   */
  async getAllGroupMessages(groupUuid, maxPages = 10) {
    const allMessages = [];
    let currentPage = 0;
    let hasMoreMessages = true;
    let totalPagesFetched = 0;

    console.log(`📥 Starting to fetch messages for group: ${groupUuid} (max pages: ${maxPages})`);

    while (hasMoreMessages && currentPage < maxPages) {
      try {
        const result = await this.getGroupMessages(groupUuid, currentPage);
        
        if (result.messages && result.messages.length > 0) {
          allMessages.push(...result.messages);
          totalPagesFetched++;
          console.log(`📄 Page ${currentPage}: Added ${result.messages.length} messages (Total: ${allMessages.length})`);
          currentPage++;
        } else {
          console.log(`📄 Page ${currentPage}: No more messages found`);
          hasMoreMessages = false;
        }
      } catch (error) {
        console.error(`❌ Failed to fetch page ${currentPage} for group ${groupUuid}:`, error.message);
        
        // If it's a 422 error on the first page, the group might not be accessible
        if (error.message.includes('422') && currentPage === 0) {
          console.error(`⚠️  This group may not be accessible or the UUID might be invalid`);
          break;
        }
        
        hasMoreMessages = false;
      }
    }

    console.log(`✅ Completed fetching messages for group ${groupUuid}: ${allMessages.length} messages from ${totalPagesFetched} pages`);
    return allMessages;
  }
}

module.exports = TwoChatAPI; 