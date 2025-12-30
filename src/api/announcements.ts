import { z } from 'zod';

declare const API_BASE_URI: string;

export type Announcement = {
  id: number;
  title: string;
  content: string;
  link_url?: string;
  priority: number;
  created_at: number;
  updated_at?: number;
};

const AnnouncementSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  link_url: z.string().nullable().optional(),
  priority: z.number(),
  created_at: z.number(),
  updated_at: z.number().nullable().optional(),
});

const AnnouncementsResponseSchema = z.object({
  announcements: z.array(AnnouncementSchema),
});

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const res = await fetch(`${API_BASE_URI}/announcements`);

  if (!res.ok) {
    throw new Error(`공지사항 조회에 실패했습니다. (status: ${res.status})`);
  }

  const json = await res.json();
  const parsed = AnnouncementsResponseSchema.safeParse(json);

  if (!parsed.success) {
    console.error('Invalid announcements response:', parsed.error);
    return [];
  }

  return parsed.data.announcements.map(a => ({
    ...a,
    link_url: a.link_url ?? undefined,
    updated_at: a.updated_at ?? undefined,
  }));
}
