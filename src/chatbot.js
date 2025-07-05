// src/chatbot.js
import { NewOaksAPI } from './newoaks-api.js';

export class ChatBot {
    constructor() {
        this.sessionId = null;
        this.isResponseGenerating = false;
        this.chatHistory = [];
    }

    async initialize() {
        try {
            this.sessionId = await NewOaksAPI.createSession();
            console.log('NewOaks session created:', this.sessionId);
        } catch (error) {
            console.error('Failed to initialize NewOaks session:', error);
            throw error;
        }
    }

    async sendMessage(message) {
        if (this.isResponseGenerating) return;
        this.isResponseGenerating = true;

        // Add user message to history
        this.chatHistory.push({ role: "user", content: message });

        try {
            // For streaming response
            await NewOaksAPI.streamMessage(
                this.sessionId,
                message,
                (data) => {
                    // Handle streaming data
                    this.handleStreamingResponse(data);
                }
            );
        } catch (error) {
            console.error('Error in sendMessage:', error);
            this.isResponseGenerating = false;
            this.handleError(error.message);
        }
    }

    handleStreamingResponse(data) {
        // Update UI with streaming response
        const responseElement = document.getElementById('bot-response');
        if (!responseElement) return;

        if (data.content) {
            responseElement.textContent += data.content;
            scrollToBottom();
        }

        if (data.finish_reason) {
            // Complete the response
            this.chatHistory.push({ 
                role: "assistant", 
                content: responseElement.textContent 
            });
            this.isResponseGenerating = false;
            this.enableInput();
        }
    }

    handleError(errorMessage) {
        // Display error in UI
        const errorElement = document.createElement('div');
        errorElement.className = 'message error';
        errorElement.textContent = `Error: ${errorMessage}`;
        document.querySelector('.chat-list').appendChild(errorElement);
        scrollToBottom();
    }

    // ... other helper methods ...
}

function scrollToBottom() {
    const chatContainer = document.querySelector('.chat-list');
    chatContainer.scrollTop = chatContainer.scrollHeight;
}
