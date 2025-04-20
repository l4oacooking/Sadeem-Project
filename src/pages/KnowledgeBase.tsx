
import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Video, FileText, Link, Upload, Trash2, Search } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

type KnowledgeItem = {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'document' | 'link';
  url: string;
  thumbnail?: string;
  createdAt: Date;
  tags: string[];
};

const demoKnowledgeItems: KnowledgeItem[] = [
  {
    id: '1',
    title: 'Getting Started with the Platform',
    description: 'A quick overview of how to use the admin dashboard',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=example1',
    thumbnail: '/placeholder.svg',
    createdAt: new Date('2023-12-01'),
    tags: ['tutorial', 'admin']
  },
  {
    id: '2',
    title: 'Setting Up Your First Product',
    description: 'Learn how to create and configure products',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=example2',
    thumbnail: '/placeholder.svg',
    createdAt: new Date('2023-12-05'),
    tags: ['products', 'tutorial']
  },
  {
    id: '3',
    title: 'User Guide PDF',
    description: 'Complete documentation on using the platform',
    type: 'document',
    url: '/documents/user-guide.pdf',
    createdAt: new Date('2023-11-15'),
    tags: ['documentation', 'guide']
  },
  {
    id: '4',
    title: 'WhatsApp Bot Configuration',
    description: 'How to set up and manage your WhatsApp bot',
    type: 'link',
    url: 'https://example.com/whatsapp-guide',
    createdAt: new Date('2023-12-10'),
    tags: ['bot', 'whatsapp', 'configuration']
  }
];

interface KnowledgeBaseProps {
  isAdmin?: boolean;
}

export default function KnowledgeBase({ isAdmin = false }: KnowledgeBaseProps) {
  const { t, language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<KnowledgeItem[]>(demoKnowledgeItems);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedTab === 'all') return matchesSearch;
    return item.type === selectedTab && matchesSearch;
  });

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'video': return <Video className="text-blue-500" />;
      case 'document': return <FileText className="text-green-500" />;
      case 'link': return <Link className="text-purple-500" />;
      default: return null;
    }
  };

  return (
    <MainLayout isAdmin={isAdmin}>
      <div className="space-y-6">
        <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("Knowledge Base")}</h1>
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

        {isAdmin && isAddingNew ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("Add New Knowledge Resource")}</CardTitle>
              <CardDescription>
                {t("Upload or link to resources that will help store owners")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t("Title")}</label>
                    <Input placeholder={t("Enter resource title")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t("Description")}</label>
                    <Input placeholder={t("Enter a brief description")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t("Resource Type")}</label>
                    <Tabs defaultValue="video">
                      <TabsList className="w-full">
                        <TabsTrigger value="video" className="flex-1">{t("Video")}</TabsTrigger>
                        <TabsTrigger value="document" className="flex-1">{t("Document")}</TabsTrigger>
                        <TabsTrigger value="link" className="flex-1">{t("Link")}</TabsTrigger>
                      </TabsList>
                      <TabsContent value="video" className="pt-4">
                        <Input placeholder={t("YouTube or video URL")} />
                      </TabsContent>
                      <TabsContent value="document" className="pt-4">
                        <Button variant="outline" className="w-full h-24">
                          <Upload className="mr-2" />
                          {t("Upload PDF or Document")}
                        </Button>
                      </TabsContent>
                      <TabsContent value="link" className="pt-4">
                        <Input placeholder={t("External resource URL")} />
                      </TabsContent>
                    </Tabs>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t("Tags")}</label>
                    <Input placeholder={t("Enter tags separated by commas")} />
                  </div>
                </div>
                <div className={`flex justify-end gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                    {t("Cancel")}
                  </Button>
                  <Button type="submit">{t("Save Resource")}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
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
                    {item.thumbnail && item.type === 'video' && (
                      <div className="relative aspect-video bg-muted rounded-md overflow-hidden mb-3">
                        <img src={item.thumbnail} alt={item.title} className="object-cover w-full h-full" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Button variant="ghost" size="icon" className="text-white">
                            <Video size={30} />
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className={`flex flex-wrap gap-1 mb-2 ${language === 'ar' ? 'justify-end' : ''}`}>
                      {item.tags.map(tag => (
                        <span key={tag} className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className={`flex ${language === 'ar' ? 'justify-start' : 'justify-end'}`}>
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
