class ChatViewer {
    constructor() {
        this.currentData = null;
        this.currentGroup = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadFromLocalStorage();
    }

    bindEvents() {
        // Search form
        document.getElementById('searchBtn').addEventListener('click', () => this.searchChats());
        document.getElementById('demoBtn').addEventListener('click', () => this.loadDemoData());
        
        // Header buttons
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshData());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportAllData());
        
        // Chat navigation
        document.getElementById('backToGroups').addEventListener('click', () => this.showGroups());
        document.getElementById('exportGroupBtn').addEventListener('click', () => this.exportCurrentGroup());
        
        // Error handling
        document.getElementById('retryBtn').addEventListener('click', () => this.searchChats());
        
        // Enter key support
        document.getElementById('phoneNumber').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchChats();
        });
        document.getElementById('groupTitle').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchChats();
        });
    }

    async searchChats() {
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        const groupTitle = document.getElementById('groupTitle').value.trim();
        const maxPages = document.getElementById('maxPages').value;

        this.showLoading();

        try {
            let response;
            
            if (!phoneNumber) {
                // Search all predefined numbers
                response = await fetch('/api/chat/search-all', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        groupTitle: groupTitle || undefined,
                        maxPages: parseInt(maxPages),
                        export: false
                    })
                });
            } else {
                // Validate phone number format
                const phoneRegex = /^\+[1-9]\d{1,14}$/;
                if (!phoneRegex.test(phoneNumber)) {
                    this.showError('Please enter a valid phone number in international format (e.g., +1234567890)');
                    return;
                }

                // Search single number
                response = await fetch('/api/chat/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        phoneNumber,
                        groupTitle: groupTitle || undefined,
                        maxPages: parseInt(maxPages),
                        export: false
                    })
                });
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to search chats');
            }

            if (data.success) {
                this.currentData = data.data;
                this.saveToLocalStorage();
                this.displayResults();
            } else {
                throw new Error(data.error || 'Search failed');
            }

        } catch (error) {
            console.error('Search error:', error);
            this.showError(error.message);
        }
    }

    async loadDemoData() {
        this.showLoading();

        try {
            const response = await fetch('/api/chat/demo');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load demo data');
            }

            if (data.success) {
                this.currentData = data.data;
                this.saveToLocalStorage();
                this.displayResults();
            } else {
                throw new Error(data.error || 'Demo failed');
            }

        } catch (error) {
            console.error('Demo error:', error);
            this.showError(error.message);
        }
    }

    displayResults() {
        this.hideAllStates();

        if (!this.currentData || !this.currentData.results || this.currentData.results.length === 0) {
            this.showNoResults();
            return;
        }

        this.updateStats();
        this.renderGroups();
        this.showGroups();
    }

    updateStats() {
        const groupCount = this.currentData.results.length;
        const totalMessages = this.currentData.results.reduce((sum, result) => {
            return sum + (result.messagesCount || 0);
        }, 0);

        let statsText = `${groupCount} groups`;
        let sectionTitle = 'Found Groups';
        
        if (this.currentData.searchType === 'all_numbers') {
            statsText = `${groupCount} groups from ${this.currentData.numbersSearched} numbers`;
            sectionTitle = `Groups from ${this.currentData.numbersSearched} Numbers`;
        }
        
        document.getElementById('sectionTitle').textContent = sectionTitle;
        document.getElementById('groupCount').textContent = statsText;
        document.getElementById('totalMessages').textContent = `${totalMessages} messages`;
    }

    renderGroups() {
        const groupsList = document.getElementById('groupsList');
        const template = document.getElementById('groupTemplate');
        
        groupsList.innerHTML = '';

        this.currentData.results.forEach((result, index) => {
            const groupElement = template.content.cloneNode(true);
            
            // Set group info
            const groupName = result.group.name || 'Unnamed Group';
            const phoneInfo = this.currentData.searchType === 'all_numbers' ? ` (${result.phoneNumber})` : '';
            groupElement.querySelector('.group-name').textContent = groupName + phoneInfo;
            groupElement.querySelector('.group-subject').textContent = result.group.subject || 'No subject';
            groupElement.querySelector('.group-size').textContent = `${result.group.size} participants`;
            groupElement.querySelector('.message-count').textContent = `${result.messagesCount} messages`;

            // Handle errors
            if (result.error) {
                groupElement.querySelector('.message-count').textContent = 'Error';
                groupElement.querySelector('.message-count').style.background = 'rgba(231, 76, 60, 0.1)';
                groupElement.querySelector('.message-count').style.color = '#e74c3c';
                groupElement.querySelector('.view-messages').disabled = true;
                groupElement.querySelector('.view-messages').textContent = 'Error';
            }

            // Add click handler
            const viewButton = groupElement.querySelector('.view-messages');
            viewButton.addEventListener('click', () => this.viewGroupMessages(index));

            groupsList.appendChild(groupElement);
        });
    }

    viewGroupMessages(groupIndex) {
        const result = this.currentData.results[groupIndex];
        
        if (result.error) {
            this.showError(`Cannot view messages: ${result.error}`);
            return;
        }

        this.currentGroup = result;
        this.renderMessages();
        this.showChat();
    }

    renderMessages() {
        const messagesContainer = document.getElementById('messagesContainer');
        const template = document.getElementById('messageTemplate');
        
        messagesContainer.innerHTML = '';

        // Update chat header
        const groupName = this.currentGroup.group.name || 'Unnamed Group';
        const phoneInfo = this.currentData.searchType === 'all_numbers' ? ` (${this.currentGroup.phoneNumber})` : '';
        document.getElementById('currentGroupName').textContent = groupName + phoneInfo;
        document.getElementById('currentGroupInfo').textContent = 
            `${this.currentGroup.group.subject || 'No subject'} • ${this.currentGroup.group.size} participants • ${this.currentGroup.messagesCount} messages`;

        if (!this.currentGroup.messages || this.currentGroup.messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="no-results-content">
                    <i class="fas fa-comments"></i>
                    <h3>No Messages Found</h3>
                    <p>This group doesn't have any accessible messages.</p>
                </div>
            `;
            return;
        }

        // Sort messages by date (newest first)
        const sortedMessages = [...this.currentGroup.messages].sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
        });

        sortedMessages.forEach(message => {
            const messageElement = template.content.cloneNode(true);
            
            // Set message info
            const senderName = messageElement.querySelector('.sender-name');
            const messageTime = messageElement.querySelector('.message-time');
            const messageText = messageElement.querySelector('.message-text');
            const messageMedia = messageElement.querySelector('.message-media');

            // Sender name
            if (message.participant) {
                senderName.textContent = message.participant.pushname || message.participant.phone_number || 'Unknown';
            } else {
                senderName.textContent = 'Unknown';
            }

            // Message time
            if (message.created_at) {
                const date = new Date(message.created_at);
                messageTime.textContent = date.toLocaleString();
            } else {
                messageTime.textContent = 'Unknown time';
            }

            // Message content
            if (message.message && message.message.text) {
                messageText.textContent = message.message.text;
            } else {
                messageText.textContent = '[No text content]';
            }

            // Media content
            if (message.message && message.message.media) {
                messageMedia.classList.remove('hidden');
                const media = message.message.media;
                messageMedia.innerHTML = `
                    <strong>Media:</strong> ${media.type || 'Unknown type'}<br>
                    ${media.url ? `<a href="${media.url}" target="_blank">View Media</a>` : 'No URL available'}
                `;
            }

            messagesContainer.appendChild(messageElement);
        });
    }

    showGroups() {
        this.hideAllStates();
        document.getElementById('groupsSection').classList.remove('hidden');
    }

    showChat() {
        this.hideAllStates();
        document.getElementById('chatSection').classList.remove('hidden');
    }

    showLoading() {
        this.hideAllStates();
        document.getElementById('loadingState').classList.remove('hidden');
    }

    showNoResults() {
        this.hideAllStates();
        document.getElementById('noResultsState').classList.remove('hidden');
    }

    showError(message) {
        this.hideAllStates();
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorState').classList.remove('hidden');
    }

    hideAllStates() {
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('groupsSection').classList.add('hidden');
        document.getElementById('chatSection').classList.add('hidden');
        document.getElementById('noResultsState').classList.add('hidden');
        document.getElementById('errorState').classList.add('hidden');
    }

    refreshData() {
        if (this.currentData) {
            this.searchChats();
        } else {
            this.showError('No data to refresh. Please search for chats first.');
        }
    }

    exportAllData() {
        if (!this.currentData) {
            this.showError('No data to export. Please search for chats first.');
            return;
        }

        const dataStr = JSON.stringify(this.currentData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `chat-export-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    exportCurrentGroup() {
        if (!this.currentGroup) {
            this.showError('No group selected to export.');
            return;
        }

        const dataStr = JSON.stringify(this.currentGroup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `group-${this.currentGroup.group.name.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    saveToLocalStorage() {
        if (this.currentData) {
            localStorage.setItem('chatViewerData', JSON.stringify({
                data: this.currentData,
                timestamp: new Date().toISOString()
            }));
        }
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('chatViewerData');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const age = new Date() - new Date(parsed.timestamp);
                
                // Only load if data is less than 1 hour old
                if (age < 3600000) {
                    this.currentData = parsed.data;
                    this.displayResults();
                } else {
                    localStorage.removeItem('chatViewerData');
                }
            } catch (error) {
                console.error('Error loading from localStorage:', error);
                localStorage.removeItem('chatViewerData');
            }
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChatViewer();
}); 