import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Grid, Bookmark, History, MessageCircle, UserPlus, UserMinus, Settings, MoreHorizontal } from 'lucide-react';
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { toast } from '@/hooks/use-toast';
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserPosts();
    }
  }, [user]);

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    toast({ 
      title: isFollowing ? "Unfollowed" : "Following", 
      description: isFollowing ? `You unfollowed ${profile?.full_name}` : `You are now following ${profile?.full_name}` 
    });
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      if (error) throw error;
      setProfile(data);
    } catch (err: any) {
      console.error("Profile Fetch Error:", err.message);
    }
  };

  const fetchUserPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts' as any)
        .select('*')
        .eq('vendor_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err: any) {
      console.error("Posts Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-[935px] mx-auto w-full mt-[80px] px-4 pb-20">
        
        {/* Profile Header */}
        <header className="flex flex-col md:flex-row gap-8 md:gap-20 mb-12 items-center md:items-start px-4">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-muted border-2 border-border overflow-hidden flex-shrink-0">
             {profile?.avatar_url ? (
               <img src={profile.avatar_url} className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-4xl font-bold bg-primary/10">
                 {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
               </div>
             )}
          </div>

          <div className="flex-1 flex flex-col gap-6 w-full">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <h2 className="text-xl font-light tracking-tight">{profile?.full_name || user?.email?.split('@')[0]}</h2>
              <div className="flex gap-2">
                <button 
                  onClick={handleFollowToggle}
                  className={`px-6 py-1.5 rounded-lg text-sm font-semibold transition-colors ${isFollowing ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : 'bg-[#0095F6] hover:bg-[#1877F2] text-white'}`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button 
                  onClick={() => navigate('/vendor-chat')}
                  className="bg-secondary text-secondary-foreground px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-secondary/80 flex items-center gap-2"
                >
                  Message
                </button>
                <Settings className="cursor-pointer" size={24} />
              </div>
            </div>

            <div className="flex justify-center md:justify-start gap-10">
              <div className="text-center md:text-left"><span className="font-bold">{posts.length}</span> posts</div>
              <div className="text-center md:text-left"><span className="font-bold">425</span> followers</div>
              <div className="text-center md:text-left"><span className="font-bold">182</span> following</div>
            </div>

            <div className="text-center md:text-left">
              <p className="font-bold text-sm">{profile?.full_name}</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile?.bio || "Sacred Vendor at Asroz • Temple Explorer"}</p>
            </div>
          </div>
        </header>

        {/* Content Tabs */}
        <Tabs defaultValue="posts" className="w-full border-t border-border" onValueChange={setActiveTab}>
          <TabsList className="flex justify-center bg-transparent gap-12 -mt-[1px]">
            <TabsTrigger value="posts" className="data-[state=active]:border-t data-[state=active]:border-foreground rounded-none bg-transparent px-0 py-4 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Grid size={14}/> Posts
            </TabsTrigger>
            <TabsTrigger value="saved" className="data-[state=active]:border-t data-[state=active]:border-foreground rounded-none bg-transparent px-0 py-4 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Bookmark size={14}/> Saved
            </TabsTrigger>
            <TabsTrigger value="stories" className="data-[state=active]:border-t data-[state=active]:border-foreground rounded-none bg-transparent px-0 py-4 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <History size={14}/> Stories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-0 pt-4">
            {loading ? (
              <div className="grid grid-cols-3 gap-1 md:gap-8">
                {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="aspect-square w-full" />)}
              </div>
            ) : posts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 md:gap-8">
                {posts.map(post => (
                  <div key={post.id} className="aspect-square bg-muted relative group cursor-pointer overflow-hidden">
                    <img src={post.image_url} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-6 text-white transition-opacity">
                       <div className="flex items-center gap-2 font-bold"><Heart className="fill-white"/> {post.likes_count || 0}</div>
                       <div className="flex items-center gap-2 font-bold"><MessageCircle className="fill-white"/> {post.comments?.length || 0}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-foreground flex items-center justify-center"><Grid size={32}/></div>
                <h3 className="text-3xl font-black">No Posts Yet</h3>
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-0 pt-4 text-center py-20">
             <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-foreground flex items-center justify-center"><Bookmark size={32}/></div>
                <h3 className="text-3xl font-black">Save</h3>
                <p className="text-sm text-muted-foreground">Save photos and videos that you want to see again.</p>
             </div>
          </TabsContent>

          <TabsContent value="stories" className="mt-0 pt-4 text-center py-20">
             <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-foreground flex items-center justify-center"><History size={32}/></div>
                <h3 className="text-3xl font-black">Archive</h3>
                <p className="text-sm text-muted-foreground">Your past stories will appear here.</p>
             </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

import { Heart } from 'lucide-react';

export default Profile;