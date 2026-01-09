import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layout, Monitor, Smartphone, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
// உங்கள் Index பக்கம் தான் ஹீரோவை கொண்டுள்ளது என்பதால் இதைப் பயன்படுத்துகிறோம்
import IndexPage from '@/pages/Index'; 

const AdminLayoutManager = () => {
  const [activeTab, setActiveTab] = useState('hero');
  const [currentLayout, setCurrentLayout] = useState('style_1');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // 1. தற்போதைய லேஅவுட்டை டேட்டாபேஸிலிருந்து எடுத்தல்
  useEffect(() => {
    const fetchLayout = async () => {
      setLoading(true);
      try {
        // 'as any' பயன்படுத்தி டைப்ஸ்கிரிப்ட் எரர் தவிர்க்கப்பட்டது
        const { data, error } = await (supabase.from('site_layouts' as any)
          .select('active_layout')
          .eq('section_name', activeTab)
          .maybeSingle() as any);

        if (error) throw error;
        if (data) setCurrentLayout(data.active_layout);
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLayout();
  }, [activeTab]);

  // 2. லேஅவுட்டை மாற்றுதல்
  const handleUpdateLayout = async (style: string) => {
    if (updating) return;
    setUpdating(true);
    try {
      const { error } = await (supabase.from('site_layouts' as any)
        .update({ active_layout: style })
        .eq('section_name', activeTab) as any);

      if (error) throw error;

      setCurrentLayout(style);
      toast({ 
        title: "Layout Updated", 
        description: `${activeTab} style changed to ${style}` 
      });
    } catch (err) {
      toast({ 
        title: "Update Failed", 
        description: "Database update error. Please try again.",
        variant: "destructive" 
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen lg:h-[85vh] gap-6 p-4 bg-background">
      {/* வலது பக்க லேஅவுட் தேர்வுகள் & ப்ரிவியூ */}
      <div className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
        <div>
          <h2 className="text-2xl font-bold capitalize mb-1">{activeTab} Customizer</h2>
          <p className="text-muted-foreground text-sm">Choose how your {activeTab} section should look to users.</p>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'style_1', name: 'Standard (L-Text | R-Card)', desc: 'Image 01 Model' },
              { id: 'style_2', name: 'Reverse (L-Card | R-Text)', desc: 'Mirror layout' },
              { id: 'style_3', name: 'Centered (Horizontal)', desc: 'Image 02 Model' }
            ].map((style) => (
              <Card 
                key={style.id}
                className={`group relative p-4 cursor-pointer border-2 transition-all duration-300 ${currentLayout === style.id ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}
                onClick={() => handleUpdateLayout(style.id)}
              >
                <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center border border-dashed relative overflow-hidden">
                  <LayoutSkeleton type={style.id} />
                  {updating && style.id === currentLayout && (
                    <div className="absolute inset-0 bg-background/40 flex items-center justify-center backdrop-blur-[1px]">
                      <Loader2 className="animate-spin h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-sm">{style.name}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{style.desc}</p>
                  </div>
                  {currentLayout === style.id && (
                    <div className="bg-primary text-primary-foreground rounded-full p-0.5">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* --- REAL-TIME PREVIEW SECTION --- */}
        <div className="border-t pt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
              <h3 className="font-bold text-lg">Live Preview</h3>
            </div>
            <div className="flex gap-4 text-muted-foreground">
               <div className="flex items-center gap-1 text-xs"><Monitor className="h-3 w-3" /> Desktop</div>
               <div className="flex items-center gap-1 text-xs"><Smartphone className="h-3 w-3" /> Mobile</div>
            </div>
          </div>
          
          <div className="rounded-2xl border bg-card shadow-2xl overflow-hidden relative group h-[650px]">
             {/* Iframe அல்லது Scaled div மூலம் உங்கள் மெயின் பக்கத்தை இங்கே காட்டுகிறோம் */}
             <div className="absolute inset-0 overflow-auto origin-top transform scale-[0.65] md:scale-[0.8] lg:scale-[1] w-full h-full no-scrollbar">
                {activeTab === 'hero' ? (
                  <IndexPage /> 
                ) : (
                  <div className="h-full flex items-center justify-center italic text-muted-foreground bg-slate-50">
                    Preview for {activeTab} coming soon...
                  </div>
                )}
             </div>
             {/* ஒரு Overlay தளம் - ப்ரிவியூவில் தெரியாமல் தடுக்க */}
             <div className="absolute inset-0 z-50 pointer-events-none border-4 border-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton Models (வரைபடங்கள்)
const LayoutSkeleton = ({ type }: { type: string }) => {
  const boxClass = "h-1 bg-slate-400/40 rounded-full";
  if (type === 'style_1') return (
    <div className="w-full p-3 flex gap-3 items-center">
      <div className="flex-1 space-y-2">
        <div className={`${boxClass} w-full`} />
        <div className={`${boxClass} w-4/5`} />
        <div className={`${boxClass} w-2/3`} />
      </div>
      <div className="w-12 h-10 bg-primary/20 rounded-md border border-primary/30 shadow-sm" />
    </div>
  );
  if (type === 'style_2') return (
    <div className="w-full p-3 flex gap-3 items-center flex-row-reverse">
      <div className="flex-1 space-y-2 text-right">
        <div className={`${boxClass} w-full ml-auto`} />
        <div className={`${boxClass} w-4/5 ml-auto`} />
        <div className={`${boxClass} w-2/3 ml-auto`} />
      </div>
      <div className="w-12 h-10 bg-primary/20 rounded-md border border-primary/30 shadow-sm" />
    </div>
  );
  return (
    <div className="w-full p-3 flex flex-col items-center gap-3">
      <div className="space-y-2 w-2/3 flex flex-col items-center">
        <div className={`${boxClass} w-full`} />
        <div className={`${boxClass} w-3/4`} />
      </div>
      <div className="w-full h-8 bg-primary/20 rounded-md border border-primary/30 shadow-sm" />
    </div>
  );
};

export default AdminLayoutManager;