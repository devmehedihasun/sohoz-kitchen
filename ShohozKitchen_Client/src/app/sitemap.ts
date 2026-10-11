import type { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shohozkitchen.vercel.app';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://shohozkitchen-server.onrender.com/api';

// ৩ সেকেন্ডের মধ্যে রেসপন্স না পেলে ফেচ ক্যান্সেল করার হেল্পার
const fetchWithTimeout = async (url: string, timeoutMs = 3000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        clearTimeout(id);
        return response;
    } catch {
        clearTimeout(id);
        return null;
    }
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();

    // ── Static routes (always present) ──────────────────────────────
    const staticRoutes: MetadataRoute.Sitemap = [
        { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
        { url: `${SITE_URL}/products`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
        { url: `${SITE_URL}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
        { url: `${SITE_URL}/track`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    ];

    const dynamicRoutes: MetadataRoute.Sitemap = [];

    // ── Products ─────────────────────────────────────────────────────
    try {
        const res = await fetchWithTimeout(`${API_BASE}/products?limit=200`);
        if (res && res.ok) {
            const json = await res.json();
            const products: any[] = Array.isArray(json?.data) ? json.data : [];
            for (const p of products) {
                if (p?.slug) {
                    dynamicRoutes.push({
                        url: `${SITE_URL}/product/${p.slug}`,
                        lastModified: p?.updatedAt ? new Date(p.updatedAt) : now,
                        changeFrequency: 'weekly',
                        priority: 0.8,
                    });
                }
            }
        }
    } catch {
        // Fallback to static routes
    }

    // ── Categories ───────────────────────────────────────────────────
    try {
        const res = await fetchWithTimeout(`${API_BASE}/categories`);
        if (res && res.ok) {
            const json = await res.json();
            const categories: any[] = Array.isArray(json?.data) ? json.data : [];
            for (const c of categories) {
                if (c?.slug) {
                    dynamicRoutes.push({
                        url: `${SITE_URL}/category/${c.slug}`,
                        lastModified: c?.updatedAt ? new Date(c.updatedAt) : now,
                        changeFrequency: 'weekly',
                        priority: 0.7,
                    });
                }
            }
        }
    } catch {
        // Fallback to static routes
    }

    return [...staticRoutes, ...dynamicRoutes];
}