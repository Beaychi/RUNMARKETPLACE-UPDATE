import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Instagram, Facebook, Twitter, Globe, Music } from "lucide-react";

interface SocialMediaSectionProps {
  vendorId?: string;
}

export default function SocialMediaSection({ vendorId }: SocialMediaSectionProps) {
  const [loading, setLoading] = useState(false);
  const [socialData, setSocialData] = useState({
    instagram_url: '',
    facebook_url: '',
    twitter_url: '',
    tiktok_url: '',
    website_url: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (vendorId) {
      fetchSocialData();
    }
  }, [vendorId]);

  const fetchSocialData = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('instagram_url, facebook_url, twitter_url, tiktok_url, website_url')
        .eq('user_id', vendorId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSocialData({
          instagram_url: data.instagram_url || '',
          facebook_url: data.facebook_url || '',
          twitter_url: data.twitter_url || '',
          tiktok_url: data.tiktok_url || '',
          website_url: data.website_url || ''
        });
      }
    } catch (error: any) {
      console.error('Error fetching social data:', error);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('vendors')
        .update(socialData)
        .eq('user_id', vendorId);

      if (error) throw error;

      toast({
        title: "Social Media Links Updated",
        description: "Your social media links have been saved successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setSocialData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Social Media Links
        </CardTitle>
        <CardDescription>
          Add your social media profiles to help customers connect with your brand
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-pink-500" />
              Instagram
            </Label>
            <Input
              id="instagram"
              type="url"
              placeholder="https://instagram.com/yourusername"
              value={socialData.instagram_url}
              onChange={(e) => handleInputChange('instagram_url', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook" className="flex items-center gap-2">
              <Facebook className="h-4 w-4 text-blue-600" />
              Facebook
            </Label>
            <Input
              id="facebook"
              type="url"
              placeholder="https://facebook.com/yourpage"
              value={socialData.facebook_url}
              onChange={(e) => handleInputChange('facebook_url', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter" className="flex items-center gap-2">
              <Twitter className="h-4 w-4 text-blue-400" />
              Twitter/X
            </Label>
            <Input
              id="twitter"
              type="url"
              placeholder="https://twitter.com/yourusername"
              value={socialData.twitter_url}
              onChange={(e) => handleInputChange('twitter_url', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tiktok" className="flex items-center gap-2">
              <Music className="h-4 w-4 text-black" />
              TikTok
            </Label>
            <Input
              id="tiktok"
              type="url"
              placeholder="https://tiktok.com/@yourusername"
              value={socialData.tiktok_url}
              onChange={(e) => handleInputChange('tiktok_url', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-600" />
              Website
            </Label>
            <Input
              id="website"
              type="url"
              placeholder="https://yourwebsite.com"
              value={socialData.website_url}
              onChange={(e) => handleInputChange('website_url', e.target.value)}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save Social Media Links"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}