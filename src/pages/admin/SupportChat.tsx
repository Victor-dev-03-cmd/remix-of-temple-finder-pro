import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Send, ChevronLeft, Search, User, Store } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from '@/components/layout/DashboardLayout';

const SupportChat = () => {
  const { user: adminUser } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('customers');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adminUser) {
      fetchConversations();
    }
  }, [adminUser, activeTab]);

  // More robust real-time subscription
  useEffect(() => {
    if (selectedChat && adminUser) {
      // Fetch initial messages
      fetchMessages(selectedChat.id);

      // Set up a unique channel for this conversation
      const channel = supabase.channel(`support-chat-${selectedChat.id}-${adminUser.id}`);

      const subscription = channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${adminUser.id}`, // Listen for messages sent TO the admin
        },
        (payload) => {
          const newMessage = payload.new;
          // Double-check if the message is from the currently selected user
          if (newMessage.sender_id === selectedChat.id) {
            setMessages((prevMessages) => {
              // Avoid adding duplicate messages
              if (prevMessages.some((msg) => msg.id === newMessage.id)) {
                return prevMessages;
              }
              return [...prevMessages, newMessage];
            });
          }
        }
      ).subscribe();

      // Cleanup subscription on component unmount or when chat changes
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedChat, adminUser]);

  useEffect(() => {
    if (messages.length) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const roleToFetch = activeTab === 'vendors' ? 'vendor' : 'customer';
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', roleToFetch)
        .neq('id', adminUser?.id);

      if (error) throw error;
      setConversations(data || []);
    } catch (err: any) {
      toast({ title: "Error fetching conversations", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    if (!adminUser) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${adminUser.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${adminUser.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      toast({ title: "Error fetching messages", description: err.message, variant: "destructive" });
    }
  };

  // Improved send message handler with optimistic UI
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedChat || !adminUser) return;

    const content = newMessage;
    setNewMessage(""); // Clear input immediately

    const tempId = `temp_${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      sender_id: adminUser.id,
      receiver_id: selectedChat.id,
      content: content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: adminUser.id,
          receiver_id: selectedChat.id,
          content: content,
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temporary message with the real one from DB
      setMessages(prev => prev.map(msg => (msg.id === tempId ? data : msg)));

    } catch (err: any) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
      // Revert optimistic update on failure
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-80px)] bg-background border rounded-lg">
        {/* Left Sidebar - Conversations */}
        <aside className={`w-full md:w-[350px] border-r flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold tracking-tight">Support Inbox</h2>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-8" />
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="m-2">
              <TabsTrigger value="customers" className="gap-2 w-full"><User size={16}/> Customers</TabsTrigger>
              <TabsTrigger value="vendors" className="gap-2 w-full"><Store size={16}/> Vendors</TabsTrigger>
            </TabsList>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {loading ? [1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg m-2"/>) : 
                  conversations.map(convo => (
                    <div 
                      key={convo.id}
                      onClick={() => setSelectedChat(convo)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedChat?.id === convo.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={convo.avatar_url} />
                        <AvatarFallback>{convo.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-semibold text-sm truncate">{convo.full_name || 'Unknown User'}</p>
                        <p className="text-xs text-muted-foreground truncate">Click to view messages</p>
                      </div>
                    </div>
                  ))
                }
              </div>
            </ScrollArea>
          </Tabs>
        </aside>

        {/* Right Side - Chat Area */}
        <main className={`flex-1 flex flex-col ${!selectedChat ? 'hidden md:flex items-center justify-center bg-background' : 'flex'}`}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="h-[75px] border-b flex items-center justify-between px-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedChat(null)}>
                    <ChevronLeft size={24}/>
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedChat.avatar_url} />
                    <AvatarFallback>{selectedChat.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-sm leading-tight">{selectedChat.full_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{selectedChat.role}</p>
                  </div>
                </div>
              </div>

              {/* Message List */}
              <ScrollArea className="flex-1 p-4 bg-muted/20">
                <div className="space-y-4 min-h-full flex flex-col justify-end">
                  {messages.map((msg) => {
                    const isAdmin = msg.sender_id === adminUser?.id;
                    return (
                      <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        {!isAdmin && (
                          <Avatar className="h-8 w-8 mr-2 self-end mb-1">
                            <AvatarImage src={selectedChat.avatar_url} />
                            <AvatarFallback>{selectedChat.full_name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`max-w-[70%] p-3 px-4 rounded-2xl text-sm ${isAdmin ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card border rounded-bl-none'}`}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <div className="p-4 flex-shrink-0 border-t">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-muted/50 border rounded-lg px-4 py-2">
                  <Input 
                    placeholder="Type your message..." 
                    className="border-none bg-transparent focus-visible:ring-0 text-sm"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <h3 className="text-xl font-bold">Select a conversation</h3>
              <p className="text-sm text-muted-foreground">Choose a customer or vendor from the list to view messages.</p>
            </div>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
};

export default SupportChat;
