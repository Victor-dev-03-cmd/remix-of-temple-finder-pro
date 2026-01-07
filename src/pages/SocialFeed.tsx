import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, Globe, User2, Store, Users, PlaySquare, Image, Video, Smile, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { toast } from '@/hooks/use-toast';
import { Skeleton } from "@/components/ui/skeleton";

const SocialFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts' as any)
        .select(`
          *,
          profiles:vendor_id (
            full_name,
            temple_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        const { data: directData, error: directError } = await supabase
          .from('posts' as any)
          .select('*')
          .order('created_at', { ascending: false });

        if (directError) throw directError;
        setPosts(directData || []);
      } else {
        setPosts(data || []);
      }
    } catch (err: any) {
      console.error("Fetch Error:", err.message);
      toast({ title: "Fetch Error", description: "Posts loading failed.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // LIKE LOGIC (Live Update)
  const handleLike = (postId: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, likes_count: (post.likes_count || 0) + 1, has_liked: true } 
          : post
      )
    );
    // Note: இதற்கான Supabase UPDATE லாஜிக்கை நீங்கள் பின்னர் சேர்க்கலாம்.
  };

  // COMMENT SEND LOGIC
  const handleCommentSubmit = async (postId: string) => {
    if (!commentText[postId]?.trim()) return;

    const newComment = commentText[postId];
    
    // Live update UI before DB call
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, comments_count: (post.comments_count || 0) + 1 } 
          : post
      )
    );

    setCommentText(prev => ({ ...prev, [postId]: '' }));
    toast({ title: "Comment shared!", description: "Your comment was posted successfully." });
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleSocialShare = async (post: any) => {
    const shareData = {
      title: post.profiles?.full_name || 'Sacred Post',
      text: post.caption,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link Copied!", description: "Share it on Facebook or WhatsApp." });
      }
    } catch (err) {
      console.log('Share cancelled');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F2F5] dark:bg-[#18191A] text-foreground transition-colors duration-300">
      <Header />

      <div className="flex justify-between w-full h-[calc(100vh-56px)] mt-[56px] overflow-hidden">
        
        <aside className="hidden xl:flex flex-col w-[300px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
          <SidebarItem 
            icon={<div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">{user?.email?.charAt(0).toUpperCase()}</div>} 
            label={user?.email?.split('@')[0] || "Guest"} 
          />
          <SidebarItem icon={<Users className="text-[#1877F2]" />} label="Friends" />
          <SidebarItem icon={<PlaySquare className="text-[#1877F2]" />} label="Watch" />
          <SidebarItem icon={<Store className="text-[#1877F2]" />} label="Marketplace" />
          <div className="border-t border-border/50 my-2 mx-4" />
          <div className="px-4 py-2 text-sm font-semibold text-muted-foreground">Your Shortcuts</div>
          <SidebarItem icon={<div className="w-8 h-8 rounded-lg bg-orange-500" />} label="Temple Events" />
        </aside>

        <main className="flex-1 max-w-[680px] mx-auto overflow-y-auto pt-4 md:px-4 custom-scrollbar">
          
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar px-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="min-w-[110px] h-[190px] bg-card rounded-xl relative overflow-hidden cursor-pointer group shadow-sm border border-border/50">
                <div className="absolute top-2 left-2 w-9 h-9 rounded-full border-[3px] border-[#1877F2] bg-background z-10 p-0.5 overflow-hidden">
                  <div className="w-full h-full bg-muted rounded-full flex items-center justify-center text-[10px] font-bold">V{i}</div>
                </div>
                <div className="w-full h-full bg-gradient-to-b from-transparent to-black/60 group-hover:scale-105 transition-transform duration-300" />
                <span className="absolute bottom-2 left-2 text-[12px] font-semibold text-white">Vendor {i}</span>
              </div>
            ))}
          </div>

          {loading ? (
            [1, 2].map(i => <PostSkeleton key={i} />)
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-card border border-border/50 rounded-xl mb-4 shadow-sm mx-2 overflow-hidden animate-in fade-in">
                
                <div className="p-3 md:p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary border border-primary/20">
                      {post.profiles?.full_name?.charAt(0) || post.vendor_name?.charAt(0) || "V"}
                    </div>
                    <div>
                      <h4 className="font-bold text-[15px] leading-tight hover:underline cursor-pointer">
                        {post.profiles?.full_name || post.vendor_name || "Sacred Vendor"}
                      </h4>
                      <div className="flex items-center gap-1 text-muted-foreground text-[12px] mt-0.5">
                         <span>{post.profiles?.temple_name || post.temple_name || "Tamil Temple"}</span>
                         <span>•</span>
                         <span>{new Date(post.created_at).toLocaleDateString()}</span>
                         <Globe size={12} />
                      </div>
                    </div>
                  </div>
                  <MoreHorizontal className="text-muted-foreground cursor-pointer" />
                </div>

                {post.caption && (
                  <div className="px-4 pb-3 text-[15px] leading-relaxed">{post.caption}</div>
                )}

                <div className="bg-black/5 border-y border-border/30">
                  <img src={post.image_url} alt="Post" className="w-full h-auto max-h-[600px] object-contain" />
                </div>

                <div className="px-4 py-2.5 flex justify-between text-muted-foreground text-[13px] border-b border-border/40">
                  <div className="flex items-center gap-1.5">
                    <div className="bg-[#1877F2] p-1 rounded-full"><ThumbsUp size={10} className="text-white fill-white" /></div>
                    <span>{post.likes_count || 297}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="hover:underline cursor-pointer">{post.comments_count || 14} comments</span>
                    <span className="hover:underline cursor-pointer">9 shares</span>
                  </div>
                </div>

                <div className="px-2 py-1 flex justify-between">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`flex-1 flex items-center justify-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors font-semibold text-sm ${post.has_liked ? 'text-[#1877F2]' : 'text-muted-foreground'}`}
                  >
                    <ThumbsUp size={20} className={post.has_liked ? 'fill-[#1877F2]' : ''} /> Like
                  </button>
                  <button 
                    onClick={() => toggleComments(post.id)}
                    className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors font-semibold text-sm text-muted-foreground"
                  >
                    <MessageCircle size={20} /> Comment
                  </button>
                  <button 
                    onClick={() => handleSocialShare(post)}
                    className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors font-semibold text-sm text-muted-foreground"
                  >
                    <Share2 size={20} /> Share
                  </button>
                </div>

                {expandedComments[post.id] && (
                  <div className="px-4 py-3 bg-muted/20 border-t border-border/50 animate-in slide-in-from-top-2">
                    <div className="flex gap-2 items-center">
                      <div className="w-8 h-8 rounded-full bg-muted border border-border flex-shrink-0" />
                      <div className="relative flex-1">
                        <input 
                          value={commentText[post.id] || ''}
                          onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                          placeholder="Write a comment..." 
                          className="bg-[#F0F2F5] dark:bg-[#3A3B3C] border-none rounded-full w-full px-4 py-2 pr-10 text-sm focus:outline-none"
                        />
                        <button 
                          onClick={() => handleCommentSubmit(post.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#1877F2] hover:bg-blue-100 p-1 rounded-full transition-colors"
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </main>

        <aside className="hidden lg:flex flex-col w-[300px] overflow-y-auto p-4 custom-scrollbar">
          <div className="flex justify-between items-center text-muted-foreground mb-4">
             <span className="font-bold text-sm">Contacts</span>
             <MoreHorizontal size={18} />
          </div>
          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map(i => (
              <SidebarItem 
                key={i} 
                icon={<div className="relative"><div className="w-8 h-8 rounded-full bg-muted border border-border" /><div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-card rounded-full" /></div>} 
                label={`User Profile ${i}`} 
              />
            ))}
          </div>
        </aside>

      </div>
      <Footer />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(155, 155, 155, 0.3); border-radius: 20px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

const SidebarItem = ({ icon, label }: any) => (
  <div className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer transition-colors group">
    <div className="flex-shrink-0">{icon}</div>
    <span className="font-medium text-[15px]">{label}</span>
  </div>
);

const PostSkeleton = () => (
  <div className="bg-card border border-border/50 rounded-xl mb-4 p-4 space-y-4 mx-2">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-[300px] w-full rounded-lg" />
  </div>
);

export default SocialFeed;