import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  ImagePlus,
  X,
  Trash2,
  Edit3,
  Circle,
  Send,
  Loader2,
  PlaySquare,
  CheckCircle2,
  Heart,
  MessageCircle,
  Share2,
  BarChart3
} from "lucide-react";

const PostUpload = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Separate fields
  const [postCaption, setPostCaption] = useState("");
  const [storyCaption, setStoryCaption] = useState("");
  const [addToStory, setAddToStory] = useState(false);

  // Data
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editPost, setEditPost] = useState<any>(null);
  const [editCaption, setEditCaption] = useState("");

  useEffect(() => {
    if (user) fetchContent();
  }, [user]);

  const fetchContent = async () => {
    // Fetch posts with live counts
    const { data: postsData } = await supabase
      .from("posts" as any)
      .select(`
        *,
        likes:likes(count),
        comments:comments(count)
      `)
      .eq("vendor_id", user?.id)
      .order("created_at", { ascending: false });

    // Fetch active stories
    const { data: storiesData } = await supabase
      .from("stories" as any)
      .select("*")
      .eq("vendor_id", user?.id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    setPosts(postsData || []);
    setStories(storiesData || []);
  };

  const handlePublish = async () => {
    if (!imageFile || !user) return;
    setLoading(true);

    try {
      const fileName = `${user.id}/${Date.now()}.${imageFile.name.split('.').pop()}`;
      await supabase.storage.from('post-images').upload(fileName, imageFile);
      const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(fileName);

      // Insert Post
      await supabase.from("posts" as any).insert({
        vendor_id: user.id,
        image_url: publicUrl,
        caption: postCaption,
      });

      // Insert Story if checked
      if (addToStory) {
        await supabase.from("stories" as any).insert({
          vendor_id: user.id,
          image_url: publicUrl,
          caption: storyCaption,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      toast({ title: "Content Published!" });
      resetForm();
      fetchContent();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setImageFile(null);
    setPreview(null);
    setPostCaption("");
    setStoryCaption("");
    setAddToStory(false);
  };

  const deleteItem = async (id: string, table: "posts" | "stories") => {
    if (!confirm("Are you sure?")) return;
    await supabase.from(table as any).delete().eq("id", id);
    fetchContent();
    toast({ title: "Deleted" });
  };

  const openEdit = (post: any) => {
    setEditPost(post);
    setEditCaption(post.caption || "");
    setEditOpen(true);
  };

  const saveEdit = async () => {
    await supabase.from("posts" as any).update({ caption: editCaption }).eq("id", editPost.id);
    setEditOpen(false);
    fetchContent();
    toast({ title: "Updated" });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 text-slate-200 font-outfit">
      
      {/* UPLOAD SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        <div className="lg:col-span-5 bg-[#11141d] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <ImagePlus className="text-blue-500" size={20} /> Create Content
          </h2>
          
          <div className="space-y-4">
            <div className={`relative h-64 rounded-xl border-2 border-dashed border-slate-800 flex items-center justify-center overflow-hidden transition-all ${preview ? 'border-none' : 'hover:bg-slate-900/50'}`}>
              {!preview ? (
                <label className="cursor-pointer text-center">
                  <ImagePlus className="mx-auto mb-2 text-slate-500" size={40} />
                  <p className="text-sm font-medium">Click to upload media</p>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { setImageFile(file); setPreview(URL.createObjectURL(file)); }
                  }} />
                </label>
              ) : (
                <div className="relative w-full h-full">
                  <img src={preview} className="w-full h-full object-cover" />
                  <button onClick={resetForm} className="absolute top-2 right-2 bg-red-500 p-1.5 rounded-full shadow-lg"><X size={16}/></button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Post Caption</label>
              <Textarea placeholder="Write post caption..." value={postCaption} onChange={(e) => setPostCaption(e.target.value)} className="bg-[#0a0c10] border-slate-800 rounded-xl min-h-[100px]" />
            </div>

            <div onClick={() => setAddToStory(!addToStory)} className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${addToStory ? 'border-blue-500 bg-blue-500/5 text-blue-400' : 'border-slate-800 text-slate-500'}`}>
              <div className="flex items-center gap-3">
                <PlaySquare size={20} />
                <span className="font-bold text-sm">Add to Story</span>
              </div>
              {addToStory ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-800" />}
            </div>

            {addToStory && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-xs font-bold text-blue-500/60 uppercase">Story Caption</label>
                <Textarea placeholder="Write story caption..." value={storyCaption} onChange={(e) => setStoryCaption(e.target.value)} className="bg-[#0a0c10] border-blue-900/20 border-slate-800 rounded-xl" />
              </div>
            )}

            <Button onClick={handlePublish} disabled={loading || !imageFile} className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold">
              {loading ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-2">Publish <Send size={16}/></span>}
            </Button>
          </div>
        </div>

        {/* LIST & LIVE STATS SECTION */}
        <div className="lg:col-span-7 bg-[#11141d] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <Tabs defaultValue="posts">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><BarChart3 size={20} className="text-green-500"/> Live Insights</h2>
              <TabsList className="bg-[#0a0c10] border border-slate-800 rounded-lg">
                <TabsTrigger value="posts" className="px-6">Posts</TabsTrigger>
                <TabsTrigger value="stories" className="px-6">Stories</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="posts">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-800 text-slate-500 text-xs uppercase font-black tracking-widest">
                    <tr>
                      <th className="pb-4 pr-4">Media</th>
                      <th className="pb-4 px-4 text-center"><Heart size={14} className="inline mr-1"/></th>
                      <th className="pb-4 px-4 text-center"><MessageCircle size={14} className="inline mr-1"/></th>
                      <th className="pb-4 px-4 text-center text-slate-600"><Share2 size={14} className="inline mr-1"/></th>
                      <th className="pb-4 pl-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {posts.map((p) => (
                      <tr key={p.id} className="group hover:bg-slate-900/30 transition-colors">
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <img src={p.image_url} className="w-12 h-12 rounded-lg object-cover border border-slate-700" />
                            <p className="text-xs font-medium max-w-[120px] truncate opacity-60">{p.caption || "No caption"}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-sm">{p.likes?.[0]?.count || 0}</td>
                        <td className="py-4 px-4 text-center font-bold text-sm">{p.comments?.[0]?.count || 0}</td>
                        <td className="py-4 px-4 text-center font-bold text-sm text-slate-600">0</td>
                        <td className="py-4 pl-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => openEdit(p)} className="p-2 hover:bg-blue-500/10 rounded-lg text-slate-500 hover:text-blue-400 transition-all"><Edit3 size={16}/></button>
                            <button onClick={() => deleteItem(p.id, "posts")} className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-all"><Trash2 size={16}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="stories" className="space-y-4">
              {stories.map((s) => (
                <div key={s.id} className="bg-[#0a0c10] p-4 rounded-xl border border-slate-800 flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={s.image_url} className="w-14 h-14 rounded-full object-cover border-2 border-blue-500 p-0.5" />
                      <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1 border-2 border-[#0a0c10]"><PlaySquare size={10}/></div>
                    </div>
                    <div>
                      <p className="text-sm font-bold truncate max-w-[150px]">{s.caption || "Sacred Story"}</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Live • 24h Active</p>
                    </div>
                  </div>
                  <button onClick={() => deleteItem(s.id, "stories")} className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={18}/></button>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* EDIT MODAL */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[#11141d] border-slate-800 text-slate-200 rounded-2xl">
          <DialogHeader><DialogTitle className="font-bold">Update Post Description</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
             {editPost && <img src={editPost.image_url} className="w-full h-40 object-cover rounded-xl border border-slate-800" />}
             <Textarea value={editCaption} onChange={(e) => setEditCaption(e.target.value)} className="bg-[#0a0c10] border-slate-800 min-h-[120px] rounded-xl" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="border-slate-800">Cancel</Button>
            <Button onClick={saveEdit} className="bg-blue-600 hover:bg-blue-700 font-bold px-8">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostUpload;