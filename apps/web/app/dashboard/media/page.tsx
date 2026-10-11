'use client';

import React, { useState } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, Film, CheckCircle2, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { apiClient } from '../../../lib/api-client';

interface MediaItem {
  id: string;
  name: string;
  size: string;
  type: 'image' | 'video';
  url: string;
  createdAt: string;
}

const DEFAULT_MEDIA: MediaItem[] = [
  {
    id: 'm1',
    name: 'product_launch_hero.png',
    size: '1.4 MB',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    createdAt: '2026-10-10',
  },
  {
    id: 'm2',
    name: 'infographic_market_share.jpg',
    size: '820 KB',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
    createdAt: '2026-10-09',
  },
];

export default function MediaLibraryPage() {
  const [mediaList, setMediaList] = useState<MediaItem[]>(DEFAULT_MEDIA);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
  ];
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadError(null);

    // Defensive File Validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError(`Unsupported file format (${file.type || 'unknown'}). Allowed: PNG, JPG, WEBP, GIF, MP4.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File exceeds maximum allowed size of 25MB (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data.data;
      setMediaList((prev) => [
        {
          id: data.id || `m-${Date.now()}`,
          name: data.filename || file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          type: file.type.startsWith('video') ? 'video' : 'image',
          url: data.url || URL.createObjectURL(file),
          createdAt: new Date().toISOString().split('T')[0],
        },
        ...prev,
      ]);
    } catch {
      // Local fallback preview
      setMediaList((prev) => [
        {
          id: `m-${Date.now()}`,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          type: file.type.startsWith('video') ? 'video' : 'image',
          url: URL.createObjectURL(file),
          createdAt: new Date().toISOString().split('T')[0],
        },
        ...prev,
      ]);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    setMediaList((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Media Asset Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Store branded images and video assets to attach across social media campaigns (Max 5 per post).
          </p>
        </div>
        <Badge variant="glow">Max 5 Attachments / Post Enforcement</Badge>
      </div>

      {uploadError && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center justify-between">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="text-xs hover:underline font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <Card className="border-dashed border-2 hover:border-primary/60 transition-colors cursor-pointer text-center p-8">
        <label className="cursor-pointer block space-y-3">
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/quicktime"
            className="hidden"
          />
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm font-bold text-foreground">
              {uploading ? 'Uploading asset...' : 'Click or drop files to upload'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, GIF, MP4 up to 25MB</p>
        </label>
      </Card>

      {/* Media Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {mediaList.map((item) => (
          <Card key={item.id} className="overflow-hidden group p-0 relative">
            <div className="aspect-square bg-muted/40 flex items-center justify-center relative overflow-hidden">
              {item.type === 'image' && item.url ? (
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <Film className="w-10 h-10 text-muted-foreground" />
              )}
              <button
                onClick={() => handleDelete(item.id)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 text-destructive hover:bg-destructive hover:text-white transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-3 text-xs">
              <p className="font-semibold truncate text-foreground">{item.name}</p>
              <div className="text-[11px] text-muted-foreground flex justify-between mt-1">
                <span>{item.size}</span>
                <span>{item.createdAt}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
