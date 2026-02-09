import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface InstalledPlugin {
  plugin_id: string;
  category: string;
  name: string;
}

// Core node categories that are always available (no plugin required)
const CORE_CATEGORIES = new Set([
  'Triggers',
  'Actions',
  'Data Manipulation',
  'Logic & Flow',
  'Custom Nodes',
]);

// Maps plugin DB categories → node definition categories
const PLUGIN_TO_NODE_CATEGORY: Record<string, string[]> = {
  'AI': ['AI & Machine Learning'],
  'Analytics': ['Analytics'],
  'Blockchain': ['Blockchain'],
  'Cloud': ['Storage'],
  'Communication': ['Communication'],
  'Database': ['Databases'],
  'Development': ['Development'],
  'E-Commerce': ['E-Commerce'],
  'Email': ['Communication'],
  'IoT': ['IoT & Real-Time'],
  'Real-time': ['IoT & Real-Time'],
  'Payments': ['Payments'],
  'Productivity': ['Productivity'],
  'Security': ['Security'],
};

export function useInstalledPlugins() {
  const { user } = useAuth();
  const [installedPlugins, setInstalledPlugins] = useState<InstalledPlugin[]>([]);
  const [allowedNodeCategories, setAllowedNodeCategories] = useState<Set<string>>(CORE_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setInstalledPlugins([]);
      setAllowedNodeCategories(CORE_CATEGORIES);
      setLoading(false);
      return;
    }

    const fetchInstalled = async () => {
      setLoading(true);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profileData) {
        setLoading(false);
        return;
      }

      const { data: installs } = await supabase
        .from('user_plugin_installs')
        .select('plugin_id')
        .eq('profile_id', profileData.id);

      if (!installs || installs.length === 0) {
        setInstalledPlugins([]);
        setAllowedNodeCategories(new Set(CORE_CATEGORIES));
        setLoading(false);
        return;
      }

      const pluginIds = installs.map(i => i.plugin_id);

      const { data: plugins } = await supabase
        .from('node_plugins')
        .select('id, category, name')
        .in('id', pluginIds);

      const installed = (plugins || []).map(p => ({
        plugin_id: p.id,
        category: p.category,
        name: p.name,
      }));

      setInstalledPlugins(installed);

      // Build allowed node categories from core + installed plugin categories
      const allowed = new Set(CORE_CATEGORIES);
      installed.forEach(p => {
        const nodeCategories = PLUGIN_TO_NODE_CATEGORY[p.category];
        if (nodeCategories) {
          nodeCategories.forEach(c => allowed.add(c));
        }
      });

      // Also add Media Processing if any media-related plugin
      setAllowedNodeCategories(allowed);
      setLoading(false);
    };

    fetchInstalled();
  }, [user]);

  return {
    installedPlugins,
    allowedNodeCategories,
    isCoreCategory: (category: string) => CORE_CATEGORIES.has(category),
    isNodeCategoryAllowed: (category: string) => allowedNodeCategories.has(category),
    loading,
  };
}
