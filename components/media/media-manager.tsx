"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MediaItem = {
  id: string;
  title: string;
  description?: string;
  url: string;
};

export default function MediaManager() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleAdd = () => {
    if (!file || !title) return;
    const url = URL.createObjectURL(file);
    const newItem: MediaItem = {
      id: Math.random().toString(36).slice(2, 9),
      title,
      description,
      url,
    };
    setItems([newItem, ...items]);
    setTitle("");
    setDescription("");
    setFile(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add media</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-2">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <div className="flex justify-end">
              <Button onClick={handleAdd} disabled={!file || !title}>Add</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((it) => (
          <Card key={it.id}>
            <img src={it.url} alt={it.title} className="h-40 w-full object-cover" />
            <CardContent>
              <div className="font-medium">{it.title}</div>
              <div className="text-sm text-muted-foreground">{it.description}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
