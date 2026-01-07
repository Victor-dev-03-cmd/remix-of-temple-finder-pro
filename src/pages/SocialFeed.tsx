import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, Globe, User2, Store, Users, PlaySquare } from 'lucide-react';
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

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // 1. முதன்மை முயற்சி: Profiles டேபிளுடன் ஜாயின் செய்து டேட்டா எடுத்தல்
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
        console.warn("Profile join failed, falling back to direct fetch:", error.message);
        
        // 2. Fallback: ஜாயின் வேலை செய்யவில்லை என்றால் போஸ்ட்களை மட்டும் எடுத்தல்
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
      console.error("Critical Fetch Error:", err.message);
      toast({ title: "Fetch Error", description: "Could not load posts.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const sharePost = (postId: string) => {
    const url = `${window.location.origin}/posts/${postId}`;
    if (navigator.share) {
      navigator.share({ title: 'Check this Temple Post', url }).catch(() => null);
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Link Copied!", description: "Share it on your social media." });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-outfit transition-colors duration-300">
      <Header />

      <div className="flex justify-between w-full h-[calc(100vh-56px)] mt-[56px] overflow-hidden">
        
        {/* LEFT SIDEBAR (Sticky/Scrollable) */}
        <aside className="hidden xl:flex flex-col w-[320px] overflow-y-auto p-4 space-y-2 border-r border-border/40 custom-scrollbar">
          <SidebarItem 
            icon={<User2 className="p-1 bg-primary/10 rounded-full text-primary" />} 
            label={user?.email?.split('@')[0] || "Guest"} 
            subLabel={user?.email}
          />
          <div className="pt-4 pb-2 text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-2">Navigation</div>
          <SidebarItem icon={<Users className="text-blue-500" />} label="Followed Vendors" />
          <div onClick={() => navigate('/marketplace')} className="cursor-pointer">
            <SidebarItem icon={<Store className="text-orange-500" />} label="Temple Market" />
          </div>
          <SidebarItem icon={<PlaySquare className="text-red-500" />} label="Temple Stories" />
        </aside>

        {/* MAIN FEED (Center) */}
        <main className="flex-1 max-w-[650px] mx-auto overflow-y-auto pt-6 px-4 custom-scrollbar">
          
          {/* STORIES SECTION (FB Style) */}
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="min-w-[120px] h-[190px] bg-muted rounded-2xl relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform border border-border group">
                <div className="absolute top-3 left-3 w-8 h-8 rounded-full border-2 border-primary bg-background z-10 overflow-hidden">
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">V{i}</div>
                </div>
                <div className="w-full h-full bg-gradient-to-b from-transparent to-black/70 group-hover:to-black/80 transition-all" />
                <span className="absolute bottom-3 left-3 text-[11px] font-bold text-white leading-tight">Vendor<br/>Story {i}</span>
              </div>
            ))}
          </div>

          {/* SKELETON OR CONTENT */}
          {loading ? (
            [1, 2].map(i => <PostSkeleton key={i} />)
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-card border rounded-2xl border-dashed">
              <p className="text-muted-foreground font-medium">No sacred posts available right now.</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-card border border-border/60 rounded-[1.5rem] mb-6 shadow-sm overflow-hidden animate-in fade-in duration-500">
                {/* Post Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary border border-primary/20 shadow-sm">
                      {post.profiles?.full_name?.charAt(0) || post.vendor_name?.charAt(0) || "V"}
                    </div>
                    <div>
                      <h4 className="font-bold text-[15px] leading-none hover:underline cursor-pointer">
                        {post.profiles?.full_name || post.vendor_name || "Temple Vendor"}
                      </h4>
                      <div className="flex items-center gap-1 text-muted-foreground text-[12px] mt-1.5 font-medium">
                        <span>{post.profiles?.temple_name || post.temple_name || "Sacred Site"}</span>
                        <span>•</span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        <Globe size={12} className="ml-1" />
                      </div>
                    </div>
                  </div>
                  <MoreHorizontal className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                </div>

                {/* Caption */}
                {post.caption && (
                  <div className="px-4 pb-3 text-[15px] leading-relaxed whitespace-pre-wrap">{post.caption}</div>
                )}

                {/* Image */}
                <div className="bg-black/10 flex justify-center items-center min-h-[300px]">
                  <img 
                    src={post.image_url} 
                    alt="Temple Media" 
                    className="w-full h-auto max-h-[600px] object-contain transition-all hover:brightness-110" 
                    loading="lazy"
                  />
                </div>

                {/* Like/Comment Counts */}
                <div className="px-4 py-3 flex justify-between text-muted-foreground text-[13px] border-b border-border/40">
                  <div className="flex items-center gap-1.5">
                    <div className="bg-primary p-1 rounded-full"><ThumbsUp size={10} className="text-white fill-white" /></div>
                    <span className="font-semibold">297</span>
                  </div>
                  <div className="flex gap-3 font-medium">
                    <span>14 Comments</span>
                    <span>9 Shares</span>
                  </div>
                </div>

                {/* Interaction Buttons */}
                <div className="px-2 py-1 flex justify-between">
                  <button className="flex-1 flex items-center justify-center gap-2 p-2.5 hover:bg-muted rounded-xl transition-all font-semibold text-sm active:scale-95">
                    <ThumbsUp size={18} /> Like
                  </button>
                  <button onClick={() => toggleComments(post.id)} className="flex-1 flex items-center justify-center gap-2 p-2.5 hover:bg-muted rounded-xl transition-all font-semibold text-sm text-primary active:scale-95">
                    <MessageCircle size={18} /> Comment
                  </button>
                  <button onClick={() => sharePost(post.id)} className="flex-1 flex items-center justify-center gap-2 p-2.5 hover:bg-muted rounded-xl transition-all font-semibold text-sm active:scale-95">
                    <Share2 size={18} /> Share
                  </button>
                </div>

                {/* Expandable Comment Input */}
                {expandedComments[post.id] && (
                  <div className="px-4 py-4 bg-muted/20 border-t border-border/50 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex gap-3 items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0" />
                      <div className="relative flex-1">
                        <input 
                          placeholder="Write a sacred comment..." 
                          className="w-full bg-background border border-border rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </main>

        {/* RIGHT SIDEBAR (Followers List) */}
        <aside className="hidden lg:flex flex-col w-[320px] overflow-y-auto p-4 border-l border-border/40 custom-scrollbar">
          <div className="flex justify-between items-center text-muted-foreground mb-4 px-2">
            <span className="font-bold text-xs uppercase tracking-widest">Recent Followers</span>
            <span className="text-[10px] font-bold text-primary hover:underline cursor-pointer">SEE ALL</span>
          </div>
          <div className="space-y-1">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <SidebarItem key={i} icon={<div className="w-8 h-8 rounded-full bg-muted border border-border shadow-inner" />} label={`Active User ${i}`} />
            ))}
          </div>
        </aside>

      </div>
      <Footer />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(155, 155, 155, 0.2); border-radius: 20px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

// COMPONENT: Post Skeleton Loader
const PostSkeleton = () => (
  <div className="bg-card border border-border/60 rounded-[1.5rem] mb-6 p-4 space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-64 w-full rounded-2xl" />
  </div>
);

// COMPONENT: Sidebar Item
const SidebarItem = ({ icon, label, subLabel }: any) => (
  <div className="flex items-center gap-3 p-3 hover:bg-muted rounded-2xl cursor-pointer transition-all duration-200 group active:scale-95">
    <div className="group-hover:scale-110 transition-transform">{icon}</div>
    <div className="flex flex-col">
      <span className="font-bold text-[14px] tracking-tight">{label}</span>
      {subLabel && <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[180px]">{subLabel}</span>}
    </div>
  </div>
);

export default SocialFeed;