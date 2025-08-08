import { useConversationStore, ConversationMessage } from "../store/conversation-store";

class ConversationService {
  private getStore() {
    return useConversationStore.getState();
  }

  // Add a user message
  addUserMessage(content: string, images?: string[]) {
    // Prevent empty messages
    if (!content || content.trim().length === 0) {
      console.warn("⚠️ Attempted to add empty user message");
      return '';
    }

    return this.getStore().addMessage({
      type: 'user',
      content,
      images
    });
  }

  // Add a status message (like "Starting UI analysis...")
  addStatusMessage(content: string, statusType: 'extracting' | 'analyzing' | 'generating' | 'complete' | 'error' = 'analyzing') {
    // Prevent empty messages
    if (!content || content.trim().length === 0) {
      console.warn("⚠️ Attempted to add empty status message");
      return '';
    }

    // Check for duplicate messages
    const existingMessages = this.getStore().messages;
    const isDuplicate = existingMessages.some((msg: ConversationMessage) => 
      msg.content === content && 
      msg.metadata?.messageType === 'status' &&
      msg.metadata?.statusType === statusType
    );

    if (isDuplicate) {
      console.warn("⚠️ Duplicate status message prevented:", content);
      return '';
    }

    return this.getStore().addMessage({
      type: 'assistant',
      content,
      metadata: {
        messageType: 'status',
        statusType
      }
    });
  }

  // Add an artifact (like JSON Structure or Version 1)
  addArtifactMessage(content: string, artifactType: 'code' | 'json', artifactData?: unknown, isActive?: boolean) {
    // Prevent empty messages
    if (!content || content.trim().length === 0) {
      console.warn("⚠️ Attempted to add empty artifact message");
      return '';
    }

    // Check for duplicate artifacts
    const existingMessages = this.getStore().messages;
    const isDuplicate = existingMessages.some((msg: ConversationMessage) => 
      msg.content === content && 
      msg.metadata?.messageType === 'artifact' &&
      msg.metadata?.artifactType === artifactType
    );

    if (isDuplicate) {
      console.warn("⚠️ Duplicate artifact message prevented:", content);
      return '';
    }

    return this.getStore().addMessage({
      type: 'assistant',
      content,
      metadata: {
        messageType: 'artifact',
        artifactType,
        artifactData,
        isActive
      }
    });
  }

  // Update an existing message (useful for transforming "Starting..." to "Complete")
  updateMessage(id: string, content: string, statusType?: 'extracting' | 'analyzing' | 'generating' | 'complete' | 'error') {
    this.getStore().updateMessage(id, {
      content,
      ...(statusType && {
        metadata: {
          ...this.getStore().getMessageById(id)?.metadata,
          statusType
        }
      })
    });
  }

  // Clear all messages
  clearConversation() {
    this.getStore().clearConversation();
  }

  // Get message by ID
  getMessageById(id: string) {
    return this.getStore().getMessageById(id);
  }

  // Mark all code artifacts as inactive, then mark specified one as active
  setActiveCodeArtifact(activeId: string) {
    const messages = this.getStore().messages;
    messages.forEach(msg => {
      if (msg.metadata?.messageType === 'artifact' && msg.metadata?.artifactType === 'code') {
        this.getStore().updateMessage(msg.id, {
          metadata: {
            ...msg.metadata,
            isActive: msg.id === activeId
          }
        });
      }
    });
  }

  // Get count of code artifacts for version numbering
  getCodeArtifactCount() {
    const messages = this.getStore().messages;
    return messages.filter(msg => 
      msg.metadata?.messageType === 'artifact' && 
      msg.metadata?.artifactType === 'code'
    ).length;
  }
}

export const conversationService = new ConversationService();