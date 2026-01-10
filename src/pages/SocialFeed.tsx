import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, Globe, Store, Users, PlaySquare, Send, Copy } from 'lucide-react';
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { toast } from '@/hooks/use-toast';
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SocialFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<string[]>([]); 
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPosts();
    if (user) fetchUserLikes();
  }, [user]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts' as any)
        .select(`
          *,
          author:profiles!vendor_id (full_name, avatar_url),
          comments (
            id, content, created_at,
            user_profile:profiles!user_id (full_name, avatar_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err: any) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLikes = async () => {
    try {
      const { data, error } = await supabase
        .from('post_likes' as any)
        .select('post_id')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      if (data) setUserLikes(data.map((l: any) => l.post_id));
    } catch (err) {
      console.error("Error fetching likes:", err);
    }
  };

  const handleLikeToggle = async (postId: string, currentLikes: number) => {
    if (!user) {
      toast({ title: "Login required", description: "Please login to like posts" });
      return;
    }

    const isLiked = userLikes.includes(postId);

    try {
      if (isLiked) {
        const { error: deleteError } = await supabase
          .from('post_likes' as any)
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        await supabase
          .from('posts' as any)
          .update({ likes_count: Math.max(0, (currentLikes || 0) - 1) })
          .eq('id', postId);

        setUserLikes(prev => prev.filter(id => id !== postId));
      } else {
        const { error: insertError } = await supabase
          .from('post_likes' as any)
          .insert([{ post_id: postId, user_id: user.id }]);

        if (insertError) throw insertError;

        await supabase
          .from('posts' as any)
          .update({ likes_count: (currentLikes || 0) + 1 })
          .eq('id', postId);

        setUserLikes(prev => [...prev, postId]);
      }
      
      setPosts(posts.map(p => 
        p.id === postId ? { ...p, likes_count: isLiked ? (p.likes_count - 1) : ((p.likes_count || 0) + 1) } : p
      ));
    } catch (err: any) {
      console.error("Like error:", err.message);
      toast({ title: "Error", description: "Failed to update like status" });
    }
  };

  const handleShare = async (post: any, type: 'copy' | 'whatsapp') => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    if (type === 'copy') {
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link Copied!" });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`, '_blank');
    }
  };

  const handleSendComment = async (postId: string) => {
    if (!commentInput[postId]?.trim() || !user) return;
    try {
      const { error } = await supabase
        .from('comments' as any)
        .insert([{ post_id: postId, user_id: user.id, content: commentInput[postId] }]);
      if (error) throw error;
      setCommentInput({ ...commentInput, [postId]: "" });
      fetchPosts(); 
      toast({ title: "Comment added" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F2F5] dark:bg-[#18191A] text-foreground">
      <Header />

      {/* CUSTOM WEBKIT SCROLLBAR STYLES */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color:rgb(248, 249, 250); /* Facebook Blue */
          border-radius: 20px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #3A3B3C; /* Dark Mode Gray */
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color:rgb(253, 253, 253);
        }
      `}</style>

      <div className="flex justify-between w-full h-[calc(100vh-56px)] mt-[56px] overflow-hidden">
        
        {/* LEFT SIDEBAR */}
        <aside className="hidden xl:flex flex-col w-[300px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
          <SidebarItem icon={<div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold">{user?.email?.charAt(0).toUpperCase() || "G"}</div>} label={user?.email?.split('@')[0] || "Guest"} />
          <SidebarItem icon={<Users className="text-[#1877F2]" />} label="Friends" />
          <SidebarItem icon={<PlaySquare className="text-[#1877F2]" />} label="Watch" />
        </aside>

        {/* MAIN FEED */}
        <main className="flex-1 max-w-[680px] mx-auto overflow-y-auto pt-4 md:px-4 custom-scrollbar">
          
          {/* FACEBOOK STYLE PORTRAIT STORIES */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar px-2">
            {/* Create Story Button (Optional Example) */}
            <div className="min-w-[110px] h-[190px] bg-card rounded-xl relative overflow-hidden cursor-pointer group border shadow-sm flex-shrink-0">
               <div className="h-[70%] overflow-hidden bg-muted">
                  <div className="w-full h-full flex items-center justify-center font-bold text-primary/20 text-4xl">
                     {user?.email?.charAt(0).toUpperCase() || "V"}
                  </div>
               </div>
               <div className="absolute bottom-0 w-full h-[30%] bg-card flex flex-col items-center">
                  <div className="absolute -top-4 bg-[#1877F2] p-1 rounded-full border-4 border-card">
                     <Plus size={18} className="text-white" />
                  </div>
                  <span className="mt-4 text-[11px] font-bold">Create story</span>
               </div>
            </div>

            {posts.slice(0, 6).map((post) => (
              <div key={`story-${post.id}`} className="min-w-[110px] h-[190px] bg-card rounded-xl relative overflow-hidden cursor-pointer group border shadow-sm flex-shrink-0 transition-transform active:scale-95">
                {/* Profile Avatar Overlay */}
                <div className="absolute top-3 left-3 w-9 h-9 rounded-full border-[3px] border-[#1877F2] bg-background z-10 p-0.5 overflow-hidden shadow-md">
                  <div className="w-full h-full bg-primary/10 rounded-full flex items-center justify-center text-[10px] font-bold">
                    {post.author?.full_name?.charAt(0) || "V"}
                  </div>
                </div>
                {/* Story Image */}
                <img src={post.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                {/* Dark Gradient bottom overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
                {/* Name */}
                <span className="absolute bottom-3 left-3 text-[11px] font-bold text-white z-10 line-clamp-2 pr-2">
                  {post.author?.full_name || "Sacred Vendor"}
                </span>
              </div>
            ))}
          </div>

          {loading ? (
            [1, 2].map(i => <PostSkeleton key={i} />)
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-card border border-border/50 rounded-xl mb-4 shadow-sm mx-2 overflow-hidden animate-in fade-in">
                
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary border border-primary/20">
                      {post.author?.full_name?.charAt(0) || "V"}
                    </div>
                    <div>
                      <h4 className="font-bold text-[15px]">{post.author?.full_name || "Sacred Vendor"}</h4>
                      <div className="flex items-center gap-1 text-muted-foreground text-[12px]">
                         <span>{post.temple_name || "Tamil Temple"}</span> • <Globe size={12} />
                      </div>
                    </div>
                  </div>
                  <MoreHorizontal className="text-muted-foreground cursor-pointer" />
                </div>

                {post.caption && <div className="px-4 pb-3 text-[15px]">{post.caption}</div>}
                <img src={post.image_url} alt="Post" className="w-full h-auto max-h-[600px] object-contain bg-black/5 border-y border-border/30" />

                <div className="px-4 py-2.5 flex justify-between text-muted-foreground text-[13px] border-b border-border/40">
                  <div className="flex items-center gap-1.5">
                    <div className="bg-[#1877F2] p-1 rounded-full">
                      <ThumbsUp size={10} className="text-white fill-white" />
                    </div>
                    <span>{post.likes_count || 0}</span>
                  </div>
                  <span onClick={() => setExpandedComments(prev => ({...prev, [post.id]: !prev[post.id]}))} className="hover:underline cursor-pointer">
                    {post.comments?.length || 0} comments
                  </span>
                </div>

                <div className="px-2 py-1 flex justify-between">
                  <button 
                    onClick={() => handleLikeToggle(post.id, post.likes_count)}
                    className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-muted rounded-lg font-semibold text-sm text-muted-foreground transition-colors"
                  >
                    <ThumbsUp size={20} className={userLikes.includes(post.id) ? "text-[#1877F2] fill-[#1877F2]" : ""} /> 
                    <span className={userLikes.includes(post.id) ? "text-[#1877F2]" : ""}>Like</span>
                  </button>
                  
                  <button onClick={() => setExpandedComments(prev => ({...prev, [post.id]: !prev[post.id]}))} className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-muted rounded-lg font-semibold text-sm text-muted-foreground">
                    <MessageCircle size={20} /> Comment
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-muted rounded-lg font-semibold text-sm text-muted-foreground">
                        <Share2 size={20} /> Share
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleShare(post, 'whatsapp')} className="text-green-600 font-bold cursor-pointer">WhatsApp</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare(post, 'copy')} className="gap-2 cursor-pointer"><Copy size={16} /> Copy Link</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {expandedComments[post.id] && (
                  <div className="bg-muted/10 border-t border-border/50 p-4 space-y-4">
                    <div className="max-h-60 overflow-y-auto space-y-3 custom-scrollbar">
                      {post.comments?.length > 0 ? (
                        post.comments.map((comment: any) => (
                          <div key={comment.id} className="flex gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-[10px] font-bold border">
                              {comment.user_profile?.full_name?.charAt(0) || "U"}
                            </div>
                            <div className="bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-2xl px-3 py-1.5 flex-1">
                              <p className="text-[12px] font-bold">{comment.user_profile?.full_name || "User"}</p>
                              <p className="text-[13px]">{comment.content}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-xs text-muted-foreground">No comments yet.</p>
                      )}
                    </div>
                    <div className="flex gap-2 items-center">
                      <input 
                        placeholder="Write a comment..." 
                        value={commentInput[post.id] || ""}
                        onChange={(e) => setCommentInput({...commentInput, [post.id]: e.target.value})}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendComment(post.id)}
                        className="bg-[#F0F2F5] dark:bg-[#3A3B3C] border-none rounded-full w-full px-4 py-2 text-sm focus:outline-none"
                      />
                      <button onClick={() => handleSendComment(post.id)} className="text-[#1877F2]"><Send size={18} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-[300px] p-4 custom-scrollbar overflow-y-auto">
          <div className="font-bold text-sm text-muted-foreground mb-4">Contacts</div>
          <SidebarItem icon={<div className="w-8 h-8 rounded-full bg-green-500 border border-white" />} label="Online Support" />
        </aside>

      </div>
      <Footer />
    </div>
  );
};

// Import Plus from Lucide for the story button example
import { Plus } from 'lucide-react';

const SidebarItem = ({ icon, label }: any) => (
  <div className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer transition-colors group">
    <div className="flex-shrink-0">{icon}</div>
    <span className="font-medium text-[15px]">{label}</span>
  </div>
);

const PostSkeleton = () => (
  <div className="bg-card border border-border/50 rounded-xl mb-4 p-4 space-y-4 mx-2">
    <div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /></div>
    <Skeleton className="h-4 w-full" /><Skeleton className="h-40 w-full rounded-lg" />
  </div>
);

export default SocialFeed;