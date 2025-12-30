export type Announcement = {
    id: number;
    title: string;
    content: string;
    link_url?: string;
    priority: number;
    created_at: number;
    updated_at?: number;
};
export declare function fetchAnnouncements(): Promise<Announcement[]>;
//# sourceMappingURL=announcements.d.ts.map