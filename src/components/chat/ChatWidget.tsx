import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const ChatWidget = () => {
  const { user, isAdmin } = useAuth();
  const {
    conversations,
    messages,
    activeConversation,
    setActiveConversation,
    createConversation,
    sendMessage,
    unreadCount
  } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    if (activeConversation) {
      await sendMessage(activeConversation.id, newMessage);
      setNewMessage('');
    }
  };

  const handleStartNewChat = async () => {
    if (!subject.trim()) return;
    
    const conversation = await createConversation(subject);
    if (conversation) {
      setShowNewChat(false);
      setSubject('');
    }
  };

  // Don't show widget for admins (they use the admin panel) or non-logged-in users
  if (isAdmin || !user) return null;

  const userConversations = conversations.filter(c => c.status === 'open');

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 relative"
            >
              <MessageCircle className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <span className="font-semibold">Support Chat</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => setIsOpen(false)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => {
                    setIsOpen(false);
                    setActiveConversation(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {!activeConversation && !showNewChat ? (
                // Conversation List
                <div className="flex-1 flex flex-col">
                  <div className="p-4 border-b">
                    <Button
                      onClick={() => setShowNewChat(true)}
                      className="w-full"
                    >
                      Start New Conversation
                    </Button>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-2">
                      {userConversations.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No active conversations
                        </p>
                      ) : (
                        userConversations.map((conv) => (
                          <div
                            key={conv.id}
                            onClick={() => setActiveConversation(conv)}
                            className="p-3 rounded-lg hover:bg-accent cursor-pointer mb-2"
                          >
                            <p className="font-medium truncate">
                              {conv.subject || 'Support Request'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(conv.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              ) : showNewChat ? (
                // New Chat Form
                <div className="flex-1 p-4 flex flex-col gap-4">
                  <h3 className="font-semibold">Start New Conversation</h3>
                  <Input
                    placeholder="What do you need help with?"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStartNewChat()}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowNewChat(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleStartNewChat}
                      className="flex-1"
                      disabled={!subject.trim()}
                    >
                      Start Chat
                    </Button>
                  </div>
                </div>
              ) : (
                // Messages View
                <>
                  <div className="p-3 border-b flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveConversation(null)}
                    >
                      ← Back
                    </Button>
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {activeConversation?.subject || 'Support'}
                    </span>
                  </div>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "max-w-[80%] p-3 rounded-2xl",
                            msg.sender_id === user?.id
                              ? "ml-auto bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted rounded-bl-md"
                          )}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className={cn(
                            "text-xs mt-1",
                            msg.sender_id === user?.id
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          )}>
                            {new Date(msg.created_at).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="p-3 border-t flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button
                      size="icon"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
