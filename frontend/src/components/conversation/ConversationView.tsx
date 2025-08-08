import { useConversationStore, ConversationMessage } from "../../store/conversation-store";
import { TypingText } from "../ui/TypingText";
import { FaCube, FaCode, FaCss3Alt } from "react-icons/fa";
import { useProjectStore } from "../../store/project-store";
import { conversationService } from "../../services/conversationService";

// Helper to check if image is a CSS file
const isCSSFile = (imageUrl: string): boolean => {
  if (imageUrl.startsWith('data:')) {
    const mimeType = imageUrl.split(';')[0].split(':')[1];
    return mimeType.includes('css') || mimeType.includes('text/css');
  }
  return false;
};

// Simple AI Avatar
const AIAvatar = ({ isGenerating = false }: { isGenerating?: boolean }) => (
  <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center relative ${isGenerating ? 'animate-pulse' : ''}`}>
    <div className="text-white text-xs font-bold">FR</div>
  </div>
);


function MessageBubble({ message }: { message: ConversationMessage }) {
  const isUser = message.type === 'user';
  const isArtifact = message.metadata?.messageType === 'artifact';
  const isStatus = message.metadata?.messageType === 'status';
  const { setHead, head } = useProjectStore();

  const handleArtifactClick = () => {
    if (isArtifact && message.metadata?.artifactType === 'code' && message.metadata?.artifactData) {
      const artifactData = message.metadata.artifactData as { code: string; commitHash: string };
      if (artifactData.commitHash) {
        // Switch to this version
        setHead(artifactData.commitHash);
        // Update active artifact indicator
        conversationService.setActiveCodeArtifact(message.id);
      }
    }
  };

  if (isArtifact) {
    // Render artifact as clickable tag
    const isCode = message.metadata?.artifactType === 'code';
    // Check if this artifact's commit is currently active
    const artifactData = message.metadata?.artifactData as { code: string; commitHash: string } | undefined;
    const isActive = isCode && artifactData?.commitHash === head;

    return (
      <div className="flex items-start space-x-4">
        <AIAvatar />
        <div className="flex-1">
          <div 
            className={`inline-flex items-center gap-3 px-5 py-4 rounded-2xl cursor-pointer transition-all duration-200 min-w-[180px] message-slide-in ${
              isCode 
                ? `glassmorphism text-slate-700 hover:shadow-md hover:scale-105 ${isActive ? 'ring-2 ring-blue-500/50 bg-blue-50/80' : ''}`
                : 'glassmorphism text-slate-700 hover:shadow-md hover:scale-105 bg-gradient-to-r from-emerald-50/80 to-green-50/80 border-emerald-200/50'
            }`}
            onClick={handleArtifactClick}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isCode 
                ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20'
                : 'bg-gradient-to-br from-emerald-500/20 to-green-500/20'
            }`}>
              {isCode ? (
                <FaCube className="text-sm text-blue-600" />
              ) : (
                <FaCode className="text-sm text-emerald-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">
                <TypingText 
                  text={message.content}
                  speed={80}
                  delay={0}
                  stableId={`artifact-${message.id}`}
                  instant={false}
                />
                {isActive && isCode && (
                  <div className="text-xs text-blue-600/80 font-normal mt-0.5">
                    Currently Viewing
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isStatus) {
    // Render status message
    const statusType = message.metadata?.statusType || 'processing';
    
    return (
      <div className="flex items-start space-x-4">
        <AIAvatar isGenerating={statusType === 'generating'} />
        <div className="flex-1">
          <div className={`glassmorphism rounded-xl px-4 py-3 message-slide-in ${
            statusType === 'complete' 
              ? 'border-green-200/50 bg-green-50/80' 
              : statusType === 'error'
                ? 'border-red-200/50 bg-red-50/80'
                : statusType === 'extracting'
                  ? 'border-orange-200/50 bg-orange-50/80'
                  : 'border-blue-200/50 bg-blue-50/80'
          }`}>
            <div className={`flex items-center space-x-2 text-sm font-medium ${
              statusType === 'complete' 
                ? 'text-green-800' 
                : statusType === 'error'
                  ? 'text-red-800'
                  : statusType === 'extracting'
                    ? 'text-orange-800'
                    : 'text-blue-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                statusType === 'complete' ? 'bg-green-500' :
                statusType === 'error' ? 'bg-red-500' :
                statusType === 'extracting' ? 'bg-orange-500 animate-pulse' :
                'bg-blue-500 animate-pulse'
              }`} />
              <TypingText 
                text={message.content}
                speed={60}
                delay={0}
                instant={statusType === 'complete' || statusType === 'error'}
                stableId={`status-${message.id}`}
              />
            </div>
            <div className="text-xs opacity-60 mt-1">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular message bubble
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'items-start space-x-4'}`}>
      {!isUser && <AIAvatar />}
      <div className={isUser ? '' : 'flex-1'}>
        <div className={`rounded-xl px-4 py-3 message-slide-in ${
          isUser 
            ? 'bg-gray-200 text-gray-800 max-w-xs' 
            : 'glassmorphism text-slate-700 mr-auto max-w-xs'
        }`}>
          <div className="text-sm">
            {isUser ? (
              <>
                {message.content}
                {message.images && message.images.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2 max-w-xs">
                    {message.images.map((image, index) => {
                      if (isCSSFile(image)) {
                        // Render CSS file as badge
                        return (
                          <div key={index} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50/80 border border-green-200/50 backdrop-blur-sm">
                            <FaCss3Alt className="text-green-600" size={16} />
                            <span className="text-xs text-green-700 font-medium">CSS File</span>
                          </div>
                        );
                      } else {
                        // Render regular image
                        return (
                          <img
                            key={index}
                            src={image}
                            alt={`Uploaded ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border border-gray-300/50"
                          />
                        );
                      }
                    })}
                  </div>
                )}
              </>
            ) : (
              <TypingText 
                text={message.content}
                speed={60}
                delay={0}
                stableId={`msg-${message.id}`}
                instant={false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConversationView() {
  const { messages } = useConversationStore();

  // Filter out empty messages
  const filteredMessages = messages.filter(message => 
    message.content && message.content.trim().length > 0
  );

  return (
    <div className="space-y-6">
      <style>{`
        .glassmorphism {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
      `}</style>
      
      {filteredMessages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}