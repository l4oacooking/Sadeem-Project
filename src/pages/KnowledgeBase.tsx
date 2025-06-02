'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Video, FileText, Link as LinkIcon, Upload, Trash2, Search } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { supabase } from '@/supabaseClient';
import { useNavigate } from 'react-router-dom';

// ثم داخل الكومبوننت:

type KnowledgeItem = {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'document' | 'link';
  url: string;
  thumbnail?: string;
  createdAt: string;
  tags: string[];
};

interface KnowledgeBaseProps {
  isAdmin?: boolean;
}

export default function KnowledgeBase({ isAdmin = false }: KnowledgeBaseProps) {
  const { t, language } = useTranslation();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [newItem, setNewItem] = useState<Partial<KnowledgeItem>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const storeId = localStorage.getItem('store_id');
    const isSuperadmin = localStorage.getItem('superadmin');
  
    if (!storeId && !isSuperadmin) {
      navigate('/login');
    }
  }, [navigate]);
  
  useEffect(() => {
    fetchKnowledgeBase();
  }, []);

  const fetchKnowledgeBase = async () => {
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to fetch knowledge base:', error.message);
    } else {
      setItems(data || []);
    }
  };

  const handleSaveNewItem = async () => {
    if (!newItem.title || !newItem.url || !newItem.type) {
      alert('Please fill all required fields.');
      return;
    }
    const fixedUrl = newItem.url?.startsWith('http') ? newItem.url : `https://${newItem.url}`;
    const insertItem = {
      id: crypto.randomUUID(),
      title: newItem.title,
      description: newItem.description || '',
      type: newItem.type,
      url: newItem.url,
      tags: (newItem.tags || []),
      thumbnail: newItem.thumbnail || '',
      created_at: new Date().toISOString(),
    };
  
    const { error } = await supabase.from('knowledge_base').insert(insertItem);
    if (error) {
      console.error('Failed to save resource:', error.message);
    } else {
      await fetchKnowledgeBase();
      setIsAddingNew(false);
      setNewItem({});
    }
  };
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('knowledge_base').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete resource:', error.message);
    } else {
      fetchKnowledgeBase();
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedTab === 'all') return matchesSearch;
    return item.type === selectedTab && matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="text-blue-500" />;
      case 'document': return <FileText className="text-green-500" />;
      case 'link': return <LinkIcon className="text-purple-500" />;
      default: return null;
    }
  };

  return (
    <MainLayout isAdmin={isAdmin}>
      <div className="space-y-6">

        {/* Header */}
        <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <div>
            <h1 className="text-3xl font-bold">{t("Knowledge Base")}</h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin ? t("Manage educational resources for store owners") : t("Learn how to use the platform effectively")}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setIsAddingNew(true)}>
              <PlusCircle className={`${language === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {t("Add New Resource")}
            </Button>
          )}
        </div>

        {/* Search and Filter */}
        <div className={`flex justify-between items-center gap-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <div className="relative flex-1">
            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-muted-foreground`} />
            <Input
              placeholder={t("Search resources...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${language === 'ar' ? 'pr-10' : 'pl-10'}`}
            />
          </div>
          <Tabs value={selectedTab} onValueChange={setSelectedTab} defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">{t("All")}</TabsTrigger>
              <TabsTrigger value="video">{t("Videos")}</TabsTrigger>
              <TabsTrigger value="document">{t("Documents")}</TabsTrigger>
              <TabsTrigger value="link">{t("Links")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Add New Item Form */}
        {isAdmin && isAddingNew ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("Add New Knowledge Resource")}</CardTitle>
              <CardDescription>{t("Upload or link to resources that will help store owners")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveNewItem(); }}>
                <div className="grid grid-cols-1 gap-4">
                  <Input
                    placeholder={t("Enter resource title")}
                    value={newItem.title || ''}
                    onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <Input
                    placeholder={t("Enter a brief description")}
                    value={newItem.description || ''}
                    onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <Input
                    placeholder={t("Resource URL")}
                    value={newItem.url || ''}
                    onChange={(e) => setNewItem(prev => ({ ...prev, url: e.target.value }))}
                  />
                  <Input
                    placeholder={t("Enter tags separated by commas")}
                    value={newItem.tags?.join(', ') || ''}
                    onChange={(e) => setNewItem(prev => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()) }))}
                  />
                </div>
                <div>
  <label className="block text-sm font-medium mb-1">{t("Resource Type")}</label>
  <Tabs defaultValue={newItem.type || 'video'} onValueChange={(val) => setNewItem(prev => ({ ...prev, type: val as 'video' | 'document' | 'link' }))}>
    <TabsList className="w-full">
      <TabsTrigger value="video" className="flex-1">{t("Video")}</TabsTrigger>
      <TabsTrigger value="document" className="flex-1">{t("Document")}</TabsTrigger>
      <TabsTrigger value="link" className="flex-1">{t("Link")}</TabsTrigger>
    </TabsList>
  </Tabs>
</div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setIsAddingNew(false)}>
                    {t("Cancel")}
                  </Button>
                  <Button type="submit">
                    {t("Save Resource")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (

          /* Display Knowledge Items */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <div className={`flex justify-between items-start ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex gap-2 items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                        {getTypeIcon(item.type)}
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                      </div>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" className="text-xs" asChild>
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                          {t("View Resource")}
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg">{t("No resources found")}</h3>
                <p className="text-muted-foreground mt-1">
                  {t("Try adjusting your search or filters")}
                </p>
              </div>
            )}
          </div>

        )}
      </div>
    </MainLayout>
  );
}
