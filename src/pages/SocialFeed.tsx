import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ThumbsUp, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Globe, 
  Send, 
  Copy, 
  Plus,
  Home,
  Users,
  Tv,
  Store,
  Gamepad2,
  Bookmark,
  Clock,
  Calendar,
  Heart,
  Image as ImageIcon
} from 'lucide-react';
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { toast } from '@/hooks/use-toast';
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const SocialFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<string[]>([]); 
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('home');

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
      toast({ title: "Link Copied!", description: "Share it with your friends" });
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

  const formatTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'friends', icon: Users, label: 'Friends' },
    { id: 'watch', icon: Tv, label: 'Watch' },
    { id: 'marketplace', icon: Store, label: 'Marketplace' },
    { id: 'gaming', icon: Gamepad2, label: 'Gaming' },
  ];

  const leftSidebarItems = [
    { icon: Users, label: 'Friends', color: 'text-blue-500' },
    { icon: Clock, label: 'Memories', color: 'text-blue-400' },
    { icon: Bookmark, label: 'Saved', color: 'text-purple-500' },
    { icon: Calendar, label: 'Events', color: 'text-red-500' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F2F5] dark:bg-[#18191A]">
      <Header />

      {/* Top Navigation Bar - Facebook Style */}
      <div className="fixed top-[64px] left-0 right-0 bg-card border-b border-border z-40 hidden md:block">
        <div className="max-w-[1920px] mx-auto flex justify-center">
          <nav className="flex items-center">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-10 py-3 transition-colors ${
                  activeTab === item.id 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="h-6 w-6 mx-auto" />
                {activeTab === item.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full"
                  />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex w-full mt-[64px] md:mt-[120px] min-h-[calc(100vh-64px)]">
        
        {/* LEFT SIDEBAR */}
        <aside className="hidden xl:block w-[280px] fixed left-0 top-[120px] bottom-0 overflow-y-auto p-3 scrollbar-thin">
          <div className="space-y-1">
            {/* User Profile */}
            <motion.div 
              whileHover={{ backgroundColor: 'hsl(var(--muted))' }}
              className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-semibold">
                  {user?.email?.charAt(0).toUpperCase() || "G"}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-[15px] text-foreground">
                {user?.email?.split('@')[0] || "Guest"}
              </span>
            </motion.div>

            {leftSidebarItems.map((item, index) => (
              <motion.div 
                key={index}
                whileHover={{ backgroundColor: 'hsl(var(--muted))' }}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className={`h-9 w-9 rounded-full bg-muted flex items-center justify-center ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="font-medium text-[15px] text-foreground">{item.label}</span>
              </motion.div>
            ))}

            <div className="border-t border-border my-3" />
            
            <p className="px-2 py-1 text-muted-foreground text-[13px] font-semibold">Your shortcuts</p>
            <div className="text-center py-8 text-muted-foreground text-sm">
              No shortcuts yet
            </div>
          </div>
        </aside>

        {/* MAIN FEED */}
        <main className="flex-1 xl:ml-[280px] xl:mr-[280px] max-w-[680px] mx-auto w-full px-4 py-4">
          
          {/* Stories Section */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none -mx-2 px-2">
            {/* Create Story Card */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="min-w-[112px] h-[200px] bg-card rounded-xl relative overflow-hidden cursor-pointer shadow-sm border border-border/50 flex-shrink-0"
            >
              <div className="h-[75%] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Avatar className="h-16 w-16 border-4 border-card">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-xl font-bold">
                    {user?.email?.charAt(0).toUpperCase() || "G"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="absolute bottom-0 w-full h-[35%] bg-card flex flex-col items-center justify-center pt-4">
                <div className="absolute -top-4 bg-primary p-1.5 rounded-full border-4 border-card shadow-lg">
                  <Plus className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-[13px] font-semibold text-foreground mt-1">Create story</span>
              </div>
            </motion.div>

            {/* Story Cards */}
            {posts.slice(0, 5).map((post, index) => (
              <motion.div 
                key={`story-${post.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="min-w-[112px] h-[200px] rounded-xl relative overflow-hidden cursor-pointer shadow-sm border border-border/50 flex-shrink-0 group"
              >
                <div className="absolute top-3 left-3 z-10">
                  <Avatar className="h-10 w-10 border-[3px] border-primary shadow-lg">
                    <AvatarImage src={post.author?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-xs font-bold">
                      {post.author?.full_name?.charAt(0) || "V"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <img 
                  src={post.image_url} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  alt="" 
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
                <span className="absolute bottom-3 left-3 right-3 text-[13px] font-semibold text-white z-10 line-clamp-2">
                  {post.author?.full_name || "Temple Vendor"}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Create Post Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl shadow-sm border border-border/50 p-4 mb-4"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-semibold">
                  {user?.email?.charAt(0).toUpperCase() || "G"}
                </AvatarFallback>
              </Avatar>
              <div 
                className="flex-1 bg-muted hover:bg-muted/80 rounded-full px-4 py-2.5 cursor-pointer transition-colors"
              >
                <span className="text-muted-foreground text-[15px]">What's on your mind?</span>
              </div>
            </div>
            <div className="border-t border-border mt-3 pt-3 flex justify-around">
              <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground hover:bg-muted">
                <Tv className="h-5 w-5 text-red-500" />
                <span className="hidden sm:inline text-[14px] font-semibold">Live video</span>
              </Button>
              <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground hover:bg-muted">
                <ImageIcon className="h-5 w-5 text-green-500" />
                <span className="hidden sm:inline text-[14px] font-semibold">Photo/video</span>
              </Button>
              <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground hover:bg-muted">
                <Heart className="h-5 w-5 text-yellow-500" />
                <span className="hidden sm:inline text-[14px] font-semibold">Feeling</span>
              </Button>
            </div>
          </motion.div>

          {/* Posts */}
          <AnimatePresence>
            {loading ? (
              [1, 2, 3].map(i => <PostSkeleton key={i} />)
            ) : (
              posts.map((post, index) => (
                <motion.div 
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-xl shadow-sm border border-border/50 mb-4 overflow-hidden"
                >
                  {/* Post Header */}
                  <div className="p-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.author?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-semibold">
                          {post.author?.full_name?.charAt(0) || "V"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-[15px] text-foreground hover:underline cursor-pointer">
                          {post.author?.full_name || "Temple Vendor"}
                        </h4>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[13px]">
                          <span>{formatTime(post.created_at)}</span>
                          <span>·</span>
                          <Globe className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted">
                          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem className="cursor-pointer">
                          <Bookmark className="h-4 w-4 mr-2" /> Save post
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Caption */}
                  {post.caption && (
                    <div className="px-4 pb-3">
                      <p className="text-[15px] text-foreground whitespace-pre-wrap">{post.caption}</p>
                    </div>
                  )}

                  {/* Post Image */}
                  <div className="relative bg-muted">
                    <img 
                      src={post.image_url} 
                      alt="Post" 
                      className="w-full max-h-[600px] object-contain" 
                    />
                  </div>

                  {/* Reactions Count */}
                  <div className="px-4 py-2.5 flex justify-between items-center text-muted-foreground text-[15px]">
                    <div className="flex items-center gap-1">
                      <div className="flex -space-x-1">
                        <div className="h-[18px] w-[18px] rounded-full bg-primary flex items-center justify-center">
                          <ThumbsUp className="h-2.5 w-2.5 text-primary-foreground fill-primary-foreground" />
                        </div>
                        <div className="h-[18px] w-[18px] rounded-full bg-red-500 flex items-center justify-center">
                          <Heart className="h-2.5 w-2.5 text-white fill-white" />
                        </div>
                      </div>
                      <span className="ml-1 hover:underline cursor-pointer">{post.likes_count || 0}</span>
                    </div>
                    <div className="flex gap-4">
                      <span 
                        onClick={() => setExpandedComments(prev => ({...prev, [post.id]: !prev[post.id]}))} 
                        className="hover:underline cursor-pointer"
                      >
                        {post.comments?.length || 0} comments
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mx-4 py-1 border-t border-border flex">
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleLikeToggle(post.id, post.likes_count)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-[15px] transition-colors hover:bg-muted ${
                        userLikes.includes(post.id) ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      <ThumbsUp className={`h-5 w-5 ${userLikes.includes(post.id) ? 'fill-primary' : ''}`} /> 
                      Like
                    </motion.button>
                    
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setExpandedComments(prev => ({...prev, [post.id]: !prev[post.id]}))} 
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-[15px] text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <MessageCircle className="h-5 w-5" /> Comment
                    </motion.button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <motion.button 
                          whileTap={{ scale: 0.95 }}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-[15px] text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <Share2 className="h-5 w-5" /> Share
                        </motion.button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleShare(post, 'whatsapp')} className="cursor-pointer gap-2">
                          <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                            <Send className="h-3 w-3 text-white" />
                          </div>
                          Share to WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare(post, 'copy')} className="cursor-pointer gap-2">
                          <Copy className="h-5 w-5" /> Copy link
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Comments Section */}
                  <AnimatePresence>
                    {expandedComments[post.id] && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-border"
                      >
                        <div className="p-4 space-y-3">
                          {/* Comment Input */}
                          <div className="flex gap-2 items-start">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-xs font-semibold">
                                {user?.email?.charAt(0).toUpperCase() || "G"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 relative">
                              <Input
                                placeholder="Write a comment..." 
                                value={commentInput[post.id] || ""}
                                onChange={(e) => setCommentInput({...commentInput, [post.id]: e.target.value})}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendComment(post.id)}
                                className="bg-muted border-none rounded-full pr-10 text-[15px] placeholder:text-muted-foreground"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleSendComment(post.id)}
                                disabled={!commentInput[post.id]?.trim()}
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full"
                              >
                                <Send className={`h-4 w-4 ${commentInput[post.id]?.trim() ? 'text-primary' : 'text-muted-foreground'}`} />
                              </Button>
                            </div>
                          </div>

                          {/* Comments List */}
                          <div className="max-h-80 overflow-y-auto space-y-2 scrollbar-thin">
                            {post.comments?.length > 0 ? (
                              post.comments.map((comment: any) => (
                                <motion.div 
                                  key={comment.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="flex gap-2"
                                >
                                  <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarImage src={comment.user_profile?.avatar_url} />
                                    <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
                                      {comment.user_profile?.full_name?.charAt(0) || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="bg-muted rounded-2xl px-3 py-2 inline-block max-w-full">
                                      <p className="text-[13px] font-semibold text-foreground">
                                        {comment.user_profile?.full_name || "User"}
                                      </p>
                                      <p className="text-[15px] text-foreground">{comment.content}</p>
                                    </div>
                                    <div className="flex gap-4 mt-1 ml-3 text-[12px] text-muted-foreground">
                                      <span className="hover:underline cursor-pointer font-semibold">Like</span>
                                      <span className="hover:underline cursor-pointer font-semibold">Reply</span>
                                      <span>{formatTime(comment.created_at)}</span>
                                    </div>
                                  </div>
                                </motion.div>
                              ))
                            ) : (
                              <p className="text-center text-sm text-muted-foreground py-4">
                                No comments yet. Be the first to comment!
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </AnimatePresence>

          {!loading && posts.length === 0 && (
            <div className="bg-card rounded-xl shadow-sm border border-border/50 p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No posts yet</h3>
              <p className="text-muted-foreground">Be the first to share something!</p>
            </div>
          )}
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="hidden xl:block w-[280px] fixed right-0 top-[120px] bottom-0 overflow-y-auto p-3 scrollbar-thin">
          <div className="space-y-4">
            <div>
              <h3 className="text-[17px] font-semibold text-muted-foreground mb-3">Sponsored</h3>
              <div className="space-y-3">
                <div className="flex gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                  <div className="h-28 w-28 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-foreground line-clamp-2">Discover Sacred Temples</p>
                    <p className="text-[12px] text-muted-foreground">temple-booking.com</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[17px] font-semibold text-muted-foreground">Contacts</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                    <div className="relative">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-sm">
                          U{i}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-card" />
                    </div>
                    <span className="font-medium text-[15px] text-foreground">User {i}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

      </div>
      <Footer />
    </div>
  );
};

const PostSkeleton = () => (
  <div className="bg-card rounded-xl shadow-sm border border-border/50 mb-4 overflow-hidden">
    <div className="p-4 flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <Skeleton className="h-4 w-3/4 mx-4 mb-3" />
    <Skeleton className="h-[300px] w-full" />
    <div className="p-4 flex justify-between">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-24" />
    </div>
    <div className="px-4 pb-4 flex gap-4">
      <Skeleton className="h-10 flex-1 rounded-lg" />
      <Skeleton className="h-10 flex-1 rounded-lg" />
      <Skeleton className="h-10 flex-1 rounded-lg" />
    </div>
  </div>
);

export default SocialFeed;
