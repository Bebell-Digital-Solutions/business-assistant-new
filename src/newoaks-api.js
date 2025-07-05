// src/newoaks-api.js
import { newoaksConfig } from './config.js';

export class NewOaksAPI {
    static async createSession() {
        try {
            const response = await fetch(`${newoaksConfig.apiBaseUrl}/chat/sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${newoaksConfig.apiKey}`
                },
                body: JSON.stringify({
                    chatbot_id: newoaksConfig.chatbotId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.session_id;
        } catch (error) {
            console.error('Error creating NewOaks session:', error);
            throw error;
        }
    }

    static async sendMessage(sessionId, message) {
        try {
            const response = await fetch(`${newoaksConfig.apiBaseUrl}/chat/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${newoaksConfig.apiKey}`
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: message,
                    chatbot_id: newoaksConfig.chatbotId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error sending message to NewOaks:', error);
            throw error;
        }
    }

    static async streamMessage(sessionId, message, onDataReceived) {
        try {
            const response = await fetch(`${newoaksConfig.apiBaseUrl}/chat/messages/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${newoaksConfig.apiKey}`
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: message,
                    chatbot_id: newoaksConfig.chatbotId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let partialData = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                partialData += chunk;

                // Process complete lines
                const lines = partialData.split('\n');
                partialData = lines.pop(); // Save incomplete line for next iteration

                for (const line of lines) {
                    if (line.trim() === '') continue;
                    try {
                        const data = JSON.parse(line);
                        onDataReceived(data);
                    } catch (e) {
                        console.error('Error parsing stream data:', e);
                    }
                }
            }
        } catch (error) {
            console.error('Error streaming message from NewOaks:', error);
            throw error;
        }
    }
}
