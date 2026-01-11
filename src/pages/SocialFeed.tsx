import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Copy, User, History, BookmarkIcon, Trash2, UserPlus, UserMinus, Plus } from 'lucide-react';
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

import { useNavigate } from 'react-router-dom';

const SocialFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<string[]>([]); 
  const [following, setFollowing] = useState<string[]>([]);
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [hiddenComments, setHiddenComments] = useState<Record<string, boolean>>({});

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
          author:profiles!vendor_id (id, full_name, avatar_url),
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
        await supabase
          .from('post_likes' as any)
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        await supabase
          .from('posts' as any)
          .update({ likes_count: Math.max(0, (currentLikes || 0) - 1) })
          .eq('id', postId);

        setUserLikes(prev => prev.filter(id => id !== postId));
      } else {
        await supabase
          .from('post_likes' as any)
          .insert([{ post_id: postId, user_id: user.id }]);

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

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const { error } = await supabase
        .from('posts' as any)
        .delete()
        .eq('id', postId);

      if (error) throw error;
      
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast({ title: "Post deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleFollowToggle = (vendorId: string) => {
    const isFollowing = following.includes(vendorId);
    if (isFollowing) {
      setFollowing(prev => prev.filter(id => id !== vendorId));
      toast({ title: "Unfollowed" });
    } else {
      setFollowing(prev => [...prev, vendorId]);
      toast({ title: "Following" });
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
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />

      <div className="flex max-w-[1200px] mx-auto w-full mt-[70px] px-4 gap-8">
        
        {/* LEFT SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-[280px] sticky top-[90px] h-fit gap-6">
          <div onClick={() => navigate('/profile')} className="flex items-center gap-4 p-2 cursor-pointer hover:bg-muted rounded-xl transition-colors">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center font-bold border border-border overflow-hidden">
               {user?.email?.charAt(0).toUpperCase() || "G"}
            </div>
            <div>
              <p className="font-bold text-sm">{user?.email?.split('@')[0] || "Guest"}</p>
              <p className="text-xs text-muted-foreground">My Profile</p>
            </div>
          </div>
          
          <nav className="flex flex-col gap-2">
            <div onClick={() => navigate('/profile')}><SidebarLink icon={<User size={22}/>} label="My Profile" /></div>
            <SidebarLink icon={<History size={22}/>} label="My Stories" />
            <SidebarLink icon={<BookmarkIcon size={22}/>} label="Saved Posts" />
          </nav>

          <div className="border-t pt-4">
            <p className="text-[12px] font-semibold text-muted-foreground mb-4 px-2 uppercase">Following</p>
            <div className="flex flex-col gap-3 px-2">
              {posts.slice(0, 3).map(post => (
                <div key={`following-${post.id}`} className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-muted border border-border overflow-hidden text-[10px] flex items-center justify-center font-bold">
                    {post.author?.avatar_url ? <img src={post.author.avatar_url} className="w-full h-full object-cover" /> : post.author?.full_name?.charAt(0)}
                   </div>
                   <span className="text-xs font-medium truncate">{post.author?.full_name}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* MAIN FEED */}
        <main className="flex-1 max-w-[600px] pb-20">
          {/* INSTAGRAM STYLE STORIES */}
          <div className="flex gap-4 overflow-x-auto py-4 px-2 no-scrollbar border-b border-border/40 mb-2">
            <div className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer">
              <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
                <div className="bg-background rounded-full p-0.5">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center font-bold overflow-hidden border border-border">
                    {user?.email?.charAt(0).toUpperCase() || "G"}
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1 border-2 border-background">
                  <Plus size={10} className="text-primary-foreground" />
                </div>
              </div>
              <span className="text-[11px] max-w-[64px] truncate">Your Story</span>
            </div>
            {posts.slice(0, 8).map((post) => (
              <div key={`story-${post.id}`} className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer">
                <div className="p-[2px] rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
                  <div className="bg-background rounded-full p-0.5">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center font-bold overflow-hidden border border-border">
                      {post.author?.avatar_url ? <img src={post.author.avatar_url} className="w-full h-full object-cover" /> : post.author?.full_name?.charAt(0)}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] max-w-[64px] truncate">{post.author?.full_name?.split(' ')[0]}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col">
            {loading ? [1, 2].map(i => <PostSkeleton key={i} />) : (
              posts.map((post) => (
                <div key={post.id} className="border-b border-border/40 pb-6 mb-4 animate-in fade-in duration-500">
                  {/* Post Header */}
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold text-[12px] border border-border overflow-hidden">
                        {post.author?.avatar_url ? <img src={post.author.avatar_url} className="w-full h-full object-cover" /> : post.author?.full_name?.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <h4 className="font-semibold text-sm leading-tight hover:underline cursor-pointer">{post.author?.full_name}</h4>
                        <p className="text-[11px] text-muted-foreground">{post.temple_name}</p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <MoreHorizontal className="text-foreground cursor-pointer" size={20} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user?.id === post.vendor_id && (
                          <DropdownMenuItem onClick={() => handleDeletePost(post.id)} className="text-red-500 gap-2 cursor-pointer font-semibold">
                            <Trash2 size={16} /> Delete Post
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleShare(post, 'whatsapp')} className="text-green-600 font-bold cursor-pointer">WhatsApp</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare(post, 'copy')} className="gap-2 cursor-pointer"><Copy size={16} /> Copy Link</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="aspect-square w-full bg-muted flex items-center justify-center overflow-hidden" onDoubleClick={() => handleLikeToggle(post.id, post.likes_count)}>
                    <img src={post.image_url} alt="Post" className="w-full h-full object-cover" />
                  </div>

                  <div className="px-3 pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleLikeToggle(post.id, post.likes_count)} className="hover:opacity-60 transition-opacity">
                        <Heart size={24} className={userLikes.includes(post.id) ? "text-red-500 fill-red-500" : "text-foreground"} />
                      </button>
                      <button onClick={() => setHiddenComments(prev => ({...prev, [post.id]: !prev[post.id]}))} className="hover:opacity-60 transition-opacity">
                        <MessageCircle size={24} className="text-foreground" />
                      </button>
                      <button onClick={() => handleShare(post, 'whatsapp')} className="hover:opacity-60 transition-opacity">
                        <Send size={24} className="text-foreground -rotate-12" />
                      </button>
                    </div>
                    <button className="hover:opacity-60 transition-opacity"><Bookmark size={24} className="text-foreground" /></button>
                  </div>

                  <div className="px-3 pt-2">
                    <p className="text-sm font-semibold">{post.likes_count || 0} likes</p>
                  </div>

                  {post.caption && (
                    <div className="px-3 pt-1 text-sm">
                      <span className="font-semibold mr-2">{post.author?.full_name}</span>
                      {post.caption}
                    </div>
                  )}

                  {!hiddenComments[post.id] && (
                    <div className="px-3 pt-1">
                      {post.comments?.length > 0 && (
                        <button className="text-muted-foreground text-[13px] mb-1 hover:text-foreground">
                          View all {post.comments.length} comments
                        </button>
                      )}
                      <div className="space-y-1">
                        {post.comments?.slice(0, 2).map((comment: any) => (
                          <div key={comment.id} className="text-[13px]">
                            <span className="font-semibold mr-2">{comment.user_profile?.full_name?.split(' ')[0]}</span>
                            {comment.content}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="px-3 pt-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="px-3 pt-3 flex items-center gap-2">
                    <input 
                      placeholder="Add a comment..." 
                      value={commentInput[post.id] || ""}
                      onChange={(e) => setCommentInput({...commentInput, [post.id]: e.target.value})}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendComment(post.id)}
                      className="bg-transparent border-none w-full py-1 text-[13px] focus:outline-none placeholder:text-muted-foreground/60"
                    />
                    {commentInput[post.id]?.trim() && (
                      <button onClick={() => handleSendComment(post.id)} className="text-primary font-semibold text-[13px]">Post</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="hidden xl:flex flex-col w-[320px] sticky top-[90px] h-fit gap-6">
           <div className="flex items-center justify-between px-2">
              <span className="text-sm font-semibold text-muted-foreground">Suggested for you</span>
              <button className="text-xs font-semibold hover:opacity-50">See All</button>
           </div>
           
           <div className="flex flex-col gap-4 px-2">
              {posts.slice(4, 9).map(post => (
                <div key={`suggest-${post.id}`} className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center font-bold text-xs">
                        {post.author?.avatar_url ? <img src={post.author.avatar_url} className="w-full h-full object-cover" /> : post.author?.full_name?.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                         <span className="text-xs font-bold leading-none">{post.author?.full_name}</span>
                         <span className="text-[10px] text-muted-foreground">New to Asroz</span>
                      </div>
                   </div>
                   <button 
                    onClick={() => handleFollowToggle(post.author.id)} 
                    className={`text-xs font-bold transition-colors ${following.includes(post.author.id) ? 'text-foreground' : 'text-[#1877F2]'}`}
                   >
                     {following.includes(post.author.id) ? (
                       <div className="flex items-center gap-1"><UserMinus size={14}/> Unfollow</div>
                     ) : (
                       <div className="flex items-center gap-1"><UserPlus size={14}/> Follow</div>
                     )}
                   </button>
                </div>
              ))}
           </div>

           <div className="border-t pt-4 px-2 mt-4 text-[10px] text-muted-foreground uppercase tracking-wider space-y-4">
              <div className="flex flex-wrap gap-2">
                <span>About</span> • <span>Help</span> • <span>Press</span> • <span>API</span> • <span>Jobs</span> • <span>Privacy</span> • <span>Terms</span>
              </div>
              <p>© 2026 ASROZ FROM SACRED TEMPLE</p>
           </div>
        </aside>

      </div>
      <Footer />
    </div>
  );
};

const SidebarLink = ({ icon, label }: { icon: any, label: string }) => (
  <div className="flex items-center gap-4 p-2 hover:bg-muted rounded-lg cursor-pointer transition-colors group">
    <div className="text-foreground group-hover:scale-110 transition-transform">{icon}</div>
    <span className="text-sm font-medium">{label}</span>
  </div>
);

const PostSkeleton = () => (
  <div className="pb-6 space-y-3">
    <div className="p-3 flex items-center gap-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="space-y-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-2 w-16" />
      </div>
    </div>
    <Skeleton className="aspect-square w-full" />
    <div className="px-3 space-y-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-full" />
    </div>
  </div>
);

export default SocialFeed;