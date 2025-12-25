import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, User, Clock, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface UserProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

const AdminChatPanel = () => {
  const { user } = useAuth();
  const {
    conversations,
    messages,
    activeConversation,
    setActiveConversation,
    sendMessage,
    closeConversation,
    loading
  } = useChat();

  const [newMessage, setNewMessage] = useState('');
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user profiles for conversations
  useEffect(() => {
    const fetchProfiles = async () => {
      const userIds = [...new Set(conversations.map(c => c.user_id))];
      if (userIds.length === 0) return;

      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      if (data) {
        const profiles: Record<string, UserProfile> = {};
        data.forEach(p => {
          profiles[p.user_id] = p;
        });
        setUserProfiles(profiles);
      }
    };

    fetchProfiles();
  }, [conversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;
    await sendMessage(activeConversation.id, newMessage);
    setNewMessage('');
  };

  const openConversations = conversations.filter(c => c.status === 'open');
  const closedConversations = conversations.filter(c => c.status === 'closed');

  const getUnreadCount = (conversationId: string) => {
    return messages.filter(m => 
      m.conversation_id === conversationId && 
      !m.is_read && 
      m.sender_id !== user?.id
    ).length;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Support Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
            {/* Conversations List */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-3 border-b">
                <h3 className="font-semibold text-sm">Conversations</h3>
              </div>
              <ScrollArea className="h-[calc(600px-48px)]">
                <div className="p-2">
                  {/* Open Conversations */}
                  {openConversations.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground px-2 mb-2">Open ({openConversations.length})</p>
                      {openConversations.map((conv) => {
                        const profile = userProfiles[conv.user_id];
                        return (
                          <div
                            key={conv.id}
                            onClick={() => setActiveConversation(conv)}
                            className={cn(
                              "p-3 rounded-lg cursor-pointer mb-2 transition-colors",
                              activeConversation?.id === conv.id
                                ? "bg-primary/10 border border-primary/20"
                                : "hover:bg-accent"
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm truncate max-w-[120px]">
                                    {profile?.full_name || profile?.email || 'Unknown User'}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                                    {conv.subject || 'No subject'}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                Open
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(conv.updated_at).toLocaleDateString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Closed Conversations */}
                  {closedConversations.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground px-2 mb-2">Closed ({closedConversations.length})</p>
                      {closedConversations.slice(0, 5).map((conv) => {
                        const profile = userProfiles[conv.user_id];
                        return (
                          <div
                            key={conv.id}
                            onClick={() => setActiveConversation(conv)}
                            className={cn(
                              "p-3 rounded-lg cursor-pointer mb-2 transition-colors opacity-60",
                              activeConversation?.id === conv.id
                                ? "bg-muted border"
                                : "hover:bg-accent"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium text-sm truncate max-w-[150px]">
                                  {profile?.full_name || 'Unknown'}
                                </p>
                                <p className="text-xs text-muted-foreground">Closed</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {conversations.length === 0 && (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      No conversations yet
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2 border rounded-lg overflow-hidden flex flex-col">
              {activeConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-muted p-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {userProfiles[activeConversation.user_id]?.full_name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activeConversation.subject}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeConversation.status === 'open' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => closeConversation(activeConversation.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Close
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const isAdmin = msg.sender_id === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "max-w-[70%] p-3 rounded-2xl",
                              isAdmin
                                ? "ml-auto bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted rounded-bl-md"
                            )}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <div className={cn(
                              "flex items-center gap-1 mt-1",
                              isAdmin ? "justify-end" : ""
                            )}>
                              <span className={cn(
                                "text-xs",
                                isAdmin ? "text-primary-foreground/70" : "text-muted-foreground"
                              )}>
                                {new Date(msg.created_at).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                              {isAdmin && msg.is_read && (
                                <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  {activeConversation.status === 'open' && (
                    <div className="p-3 border-t flex gap-2">
                      <Input
                        placeholder="Type your reply..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Select a conversation to view messages</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminChatPanel;
