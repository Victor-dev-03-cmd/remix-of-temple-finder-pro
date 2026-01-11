import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Send, MoreVertical, ShieldAlert, ChevronLeft, Search, Phone, Video, Info, MessageCircle } from 'lucide-react';
import Header from "@/components/layout/Header";
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const VendorChat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) fetchVendors();
  }, [user]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      const subscription = supabase
        .channel(`chat-${selectedChat.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
          setMessages(prev => [...prev, payload.new]);
        })
        .subscribe();
      return () => { supabase.removeChannel(subscription); };
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      // Get all vendors except current user
      const { data: vendors, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id);
      
      if (error) throw error;
      setConversations(vendors || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (vendorId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages' as any)
        .select('*')
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${vendorId}),and(sender_id.eq.${vendorId},receiver_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const { error } = await supabase
        .from('messages' as any)
        .insert([{
          sender_id: user?.id,
          receiver_id: selectedChat.id,
          content: newMessage,
        }]);

      if (error) throw error;
      setNewMessage("");
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to send message" });
    }
  };

  const handleBlockUser = async () => {
    if (window.confirm(`Block ${selectedChat.full_name}?`)) {
      toast({ title: "User Blocked", description: "You will no longer receive messages from this vendor." });
      setSelectedChat(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      
      <div className="flex flex-1 overflow-hidden pt-[60px]">
        {/* Left Sidebar - Conversations */}
        <aside className={`w-full md:w-[350px] border-r flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">{user?.email?.split('@')[0]}</h2>
            <Button variant="ghost" size="icon"><Search size={20}/></Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {loading ? [1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg m-2"/>) : 
                conversations.map(vendor => (
                  <div 
                    key={vendor.id}
                    onClick={() => setSelectedChat(vendor)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedChat?.id === vendor.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                  >
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={vendor.avatar_url} />
                      <AvatarFallback>{vendor.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-semibold text-sm truncate">{vendor.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">Active now</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </ScrollArea>
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
                    <AvatarFallback>{selectedChat.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-sm leading-tight">{selectedChat.full_name}</p>
                    <p className="text-[10px] text-green-500 font-medium uppercase tracking-tighter">Online</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon"><Phone size={20}/></Button>
                  <Button variant="ghost" size="icon"><Video size={20}/></Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><Info size={20}/></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleBlockUser} className="text-destructive font-bold gap-2">
                        <ShieldAlert size={16}/> Block Vendor
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Message List */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  <div className="flex flex-col items-center py-10 gap-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={selectedChat.avatar_url} />
                      <AvatarFallback>{selectedChat.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <h3 className="text-lg font-bold">{selectedChat.full_name}</h3>
                      <p className="text-xs text-muted-foreground">Sacred Vendor • Asroz</p>
                      <Button variant="secondary" size="sm" className="mt-4 font-bold">View Profile</Button>
                    </div>
                  </div>

                  {messages.map((msg, i) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && (
                          <Avatar className="h-8 w-8 mr-2 self-end mb-1">
                            <AvatarImage src={selectedChat.avatar_url} />
                            <AvatarFallback>{selectedChat.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`max-w-[70%] p-3 px-4 rounded-3xl text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'}`}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <div className="p-4 flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-muted/30 border rounded-full px-4 py-1">
                  <Input 
                    placeholder="Message..." 
                    className="border-none bg-transparent focus-visible:ring-0 text-sm"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  {newMessage.trim() && (
                    <Button type="submit" variant="ghost" className="text-primary font-bold hover:bg-transparent">Send</Button>
                  )}
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-24 h-24 rounded-full border-2 border-foreground flex items-center justify-center">
                <MessageCircle size={48}/>
              </div>
              <h3 className="text-2xl font-bold">Your Messages</h3>
              <p className="text-sm text-muted-foreground">Send private photos and messages to a fellow vendor.</p>
              <Button onClick={fetchVendors} className="mt-2">Send Message</Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default VendorChat;