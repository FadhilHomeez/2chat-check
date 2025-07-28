const TwoChatAPI = require('../services/2chatApi');
const fs = require('fs').promises;
const path = require('path');

class ChatController {
  constructor() {
    this.api = new TwoChatAPI();
    this.predefinedNumbers = [
      '+6580910054',
      '+6580261704',
      '+6587675861',
      '+6287811366678',
      '+6580914206',
      '+6580914387',
      '+6582040239',
      '+6582040694',
      '+6582040239',
      '+6580910054',
      '+6580910158'
    ];
  }

  /**
   * List all WhatsApp groups for a phone number
   */
  async listGroups(req, res) {
    try {
      const { phoneNumber } = req.params;
      
      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          error: 'Phone number is required'
        });
      }

      // Validate phone number format (basic validation)
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format. Use international format (e.g., +1234567890)'
        });
      }

      const groups = await this.api.listGroups(phoneNumber);
      
      res.json({
        success: true,
        data: {
          phoneNumber,
          groupsCount: groups.length,
          groups
        }
      });
    } catch (error) {
      console.error('Error in listGroups:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch groups'
      });
    }
  }

  /**
   * Get chat history for a specific group
   */
  async getChatHistory(req, res) {
    try {
      const { groupUuid } = req.params;
      const { maxPages = 10, export: exportParam = false } = req.query;
      
      if (!groupUuid) {
        return res.status(400).json({
          success: false,
          error: 'Group UUID is required'
        });
      }

      const messages = await this.api.getAllGroupMessages(groupUuid, parseInt(maxPages));
      
      const result = {
        success: true,
        data: {
          groupUuid,
          messagesCount: messages.length,
          messages
        }
      };

      // If export is requested, save to file
      if (exportParam === 'true') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `chat-history-${groupUuid}-${timestamp}.json`;
        const exportPath = path.join(__dirname, '../../exports', filename);
        
        // Ensure exports directory exists
        await fs.mkdir(path.dirname(exportPath), { recursive: true });
        
        // Save to file
        await fs.writeFile(exportPath, JSON.stringify(result, null, 2));
        
        result.export = {
          filename,
          path: exportPath
        };
      }

      res.json(result);
    } catch (error) {
      console.error('Error in getChatHistory:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch chat history'
      });
    }
  }

  /**
   * Search groups by title and get chat history
   */
  async searchGroupsByTitle(req, res) {
    try {
      const { phoneNumber, groupTitle, maxPages = 10, export: exportParam = false } = req.body;
      
      if (!phoneNumber || !groupTitle) {
        return res.status(400).json({
          success: false,
          error: 'Phone number and group title are required'
        });
      }

      // Validate phone number format
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format. Use international format (e.g., +1234567890)'
        });
      }

      // Get all groups
      const groups = await this.api.listGroups(phoneNumber);
      
      // Search for groups matching the title (case-insensitive)
      const matchingGroups = groups.filter(group => 
        group.wa_group_name && 
        group.wa_group_name.toLowerCase().includes(groupTitle.toLowerCase())
      );

      if (matchingGroups.length === 0) {
        return res.json({
          success: true,
          data: {
            phoneNumber,
            searchTerm: groupTitle,
            matchingGroups: [],
            message: 'No groups found matching the title'
          }
        });
      }

      // Get chat history for all matching groups
      const results = [];
      for (const group of matchingGroups) {
        try {
          console.log(`\n🔍 Processing group: ${group.wa_group_name} (${group.uuid})`);
          const messages = await this.api.getAllGroupMessages(group.uuid, parseInt(maxPages));
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
          console.log(`✅ Successfully processed group: ${group.wa_group_name} - ${messages.length} messages`);
        } catch (error) {
          console.error(`❌ Error processing group ${group.wa_group_name} (${group.uuid}):`, error.message);
          results.push({
            group: {
              uuid: group.uuid,
              name: group.wa_group_name,
              subject: group.wa_subject,
              size: group.size,
              created_at: group.wa_created_at
            },
            error: error.message,
            errorType: error.message.includes('422') ? 'ACCESS_DENIED' : 
                      error.message.includes('401') ? 'AUTH_ERROR' :
                      error.message.includes('404') ? 'NOT_FOUND' : 'UNKNOWN_ERROR'
          });
        }
      }

      const result = {
        success: true,
        data: {
          phoneNumber,
          searchTerm: groupTitle,
          matchingGroupsCount: matchingGroups.length,
          results
        }
      };

      // If export is requested, save to file
      if (exportParam === true) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const sanitizedTitle = groupTitle.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `search-results-${sanitizedTitle}-${timestamp}.json`;
        const exportPath = path.join(__dirname, '../../exports', filename);
        
        // Ensure exports directory exists
        await fs.mkdir(path.dirname(exportPath), { recursive: true });
        
        // Save to file
        await fs.writeFile(exportPath, JSON.stringify(result, null, 2));
        
        result.export = {
          filename,
          path: exportPath
        };
      }

      res.json(result);
    } catch (error) {
      console.error('Error in searchGroupsByTitle:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to search groups and fetch chat history'
      });
    }
  }

  /**
   * Search all predefined phone numbers
   */
  async searchAllNumbers(req, res) {
    try {
      const { groupTitle, maxPages = 10, export: exportParam = false } = req.body;
      
      console.log(`🔍 Starting search across ${this.predefinedNumbers.length} predefined numbers`);
      
      const allResults = [];
      const errors = [];
      
      // Remove duplicates from predefined numbers
      const uniqueNumbers = [...new Set(this.predefinedNumbers)];
      
      for (const phoneNumber of uniqueNumbers) {
        try {
          console.log(`📱 Searching number: ${phoneNumber}`);
          
          // Get all groups for this number
          const groups = await this.api.listGroups(phoneNumber);
          
          if (groups.length === 0) {
            console.log(`📱 No groups found for ${phoneNumber}`);
            continue;
          }
          
          // Filter groups by title if provided
          let matchingGroups = groups;
          if (groupTitle) {
            matchingGroups = groups.filter(group => 
              group.wa_group_name && 
              group.wa_group_name.toLowerCase().includes(groupTitle.toLowerCase())
            );
          }
          
          if (matchingGroups.length === 0) {
            console.log(`📱 No matching groups found for ${phoneNumber}`);
            continue;
          }
          
          // Get chat history for matching groups
          for (const group of matchingGroups) {
            try {
              console.log(`📥 Fetching messages for group: ${group.wa_group_name} (${phoneNumber})`);
              const messages = await this.api.getAllGroupMessages(group.uuid, parseInt(maxPages));
              
              allResults.push({
                phoneNumber,
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
              
              console.log(`✅ Found ${messages.length} messages for ${group.wa_group_name}`);
              
            } catch (error) {
              console.error(`❌ Error fetching messages for group ${group.uuid}:`, error.message);
              allResults.push({
                phoneNumber,
                group: {
                  uuid: group.uuid,
                  name: group.wa_group_name,
                  subject: group.wa_subject,
                  size: group.size,
                  created_at: group.wa_created_at
                },
                error: error.message,
                errorType: error.message.includes('422') ? 'ACCESS_DENIED' : 
                          error.message.includes('401') ? 'AUTH_ERROR' :
                          error.message.includes('404') ? 'NOT_FOUND' : 'UNKNOWN_ERROR'
              });
            }
          }
          
        } catch (error) {
          console.error(`❌ Error processing number ${phoneNumber}:`, error.message);
          errors.push({
            phoneNumber,
            error: error.message
          });
        }
      }
      
      const result = {
        success: true,
        data: {
          searchType: 'all_numbers',
          numbersSearched: uniqueNumbers.length,
          numbersWithErrors: errors.length,
          groupTitle: groupTitle || 'all groups',
          matchingGroupsCount: allResults.length,
          results: allResults,
          errors: errors
        }
      };

      // If export is requested, save to file
      if (exportParam === true) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const sanitizedTitle = (groupTitle || 'all-groups').replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `search-all-numbers-${sanitizedTitle}-${timestamp}.json`;
        const exportPath = path.join(__dirname, '../../exports', filename);
        
        // Ensure exports directory exists
        await fs.mkdir(path.dirname(exportPath), { recursive: true });
        
        // Save to file
        await fs.writeFile(exportPath, JSON.stringify(result, null, 2));
        
        result.export = {
          filename,
          path: exportPath
        };
      }

      console.log(`✅ Search completed: ${allResults.length} groups found across ${uniqueNumbers.length} numbers`);
      res.json(result);
      
    } catch (error) {
      console.error('Error in searchAllNumbers:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to search all numbers'
      });
    }
  }

  /**
   * Get demo data for UI testing
   */
  async getDemoData(req, res) {
    try {
      const demoData = {
        success: true,
        data: {
          phoneNumber: "+1234567890",
          searchTerm: "demo",
          matchingGroupsCount: 2,
          results: [
            {
              group: {
                uuid: "WAG-demo-group-1",
                name: "Demo Family Group",
                subject: "Family chat and updates",
                size: 8,
                created_at: "2024-01-15T10:30:00Z"
              },
              messagesCount: 3,
              messages: [
                {
                  id: "MSG-1",
                  message: {
                    text: "Hello everyone! How's everyone doing today?"
                  },
                  created_at: "2025-01-03T14:19:28",
                  sent_by: "user",
                  participant: {
                    phone_number: "+17131112222",
                    pushname: "John Doe"
                  }
                },
                {
                  id: "MSG-2",
                  message: {
                    text: "I'm doing great! Thanks for asking."
                  },
                  created_at: "2025-01-03T14:20:15",
                  sent_by: "user",
                  participant: {
                    phone_number: "+17131113333",
                    pushname: "Jane Smith"
                  }
                },
                {
                  id: "MSG-3",
                  message: {
                    text: "Don't forget about the family dinner this weekend!"
                  },
                  created_at: "2025-01-03T14:21:00",
                  sent_by: "user",
                  participant: {
                    phone_number: "+17131114444",
                    pushname: "Mom"
                  }
                }
              ]
            },
            {
              group: {
                uuid: "WAG-demo-group-2",
                name: "Work Team Demo",
                subject: "Project updates and collaboration",
                size: 12,
                created_at: "2024-02-20T09:15:00Z"
              },
              messagesCount: 2,
              messages: [
                {
                  id: "MSG-4",
                  message: {
                    text: "Good morning team! Let's start the weekly standup."
                  },
                  created_at: "2025-01-03T09:00:00",
                  sent_by: "user",
                  participant: {
                    phone_number: "+17131115555",
                    pushname: "Team Lead"
                  }
                },
                {
                  id: "MSG-5",
                  message: {
                    text: "I'll be presenting the Q4 results today."
                  },
                  created_at: "2025-01-03T09:01:30",
                  sent_by: "user",
                  participant: {
                    phone_number: "+17131116666",
                    pushname: "Analyst"
                  }
                }
              ]
            }
          ]
        }
      };

      res.json(demoData);
    } catch (error) {
      console.error('Error in getDemoData:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get demo data'
      });
    }
  }
}

module.exports = ChatController; 