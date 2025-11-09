import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDeleteContent = () => {
  const { toast } = useToast();

  const deleteStorageFile = async (url: string | null) => {
    if (!url || !url.includes('video-assets')) return;
    
    try {
      const urlParts = url.split('/video-assets/');
      if (urlParts.length < 2) return;
      
      const filePath = urlParts[1].split('?')[0];
      await supabase.storage.from('video-assets').remove([filePath]);
    } catch (error) {
      console.error('Error deleting storage file:', error);
    }
  };

  const deletePoster = async (posterId: string, posterUrl: string | null, brandLogoUrl: string | null, productImageUrl: string | null) => {
    try {
      // Delete from database
      const { error } = await supabase
        .from('generated_posters')
        .delete()
        .eq('id', posterId);

      if (error) throw error;

      // Delete storage files
      await Promise.all([
        deleteStorageFile(posterUrl),
        deleteStorageFile(brandLogoUrl),
        deleteStorageFile(productImageUrl)
      ]);

      toast({
        title: "Poster Deleted",
        description: "The poster has been successfully deleted.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting poster:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete poster.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteVideo = async (videoId: string, videoUrl: string | null, brandLogoUrl: string | null, productImageUrl: string | null) => {
    try {
      // Delete from database
      const { error } = await supabase
        .from('generated_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      // Delete storage files
      await Promise.all([
        deleteStorageFile(videoUrl),
        deleteStorageFile(brandLogoUrl),
        deleteStorageFile(productImageUrl)
      ]);

      toast({
        title: "Video Deleted",
        description: "The video has been successfully deleted.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete video.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteCritique = async (critiqueId: string, mediaUrl: string | null) => {
    try {
      // Delete from database
      const { error } = await supabase
        .from('critiques')
        .delete()
        .eq('id', critiqueId);

      if (error) throw error;

      // Delete storage file if it's in our storage
      await deleteStorageFile(mediaUrl);

      toast({
        title: "Critique Deleted",
        description: "The critique has been successfully deleted.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting critique:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete critique.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteWorkflowRun = async (workflowId: string) => {
    try {
      // Delete from database
      const { error } = await supabase
        .from('workflow_runs')
        .delete()
        .eq('id', workflowId);

      if (error) throw error;

      toast({
        title: "Workflow Deleted",
        description: "The workflow run has been successfully deleted.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete workflow run.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    deletePoster,
    deleteVideo,
    deleteCritique,
    deleteWorkflowRun,
  };
};
