import { router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

interface Post {
    id: number;
    slug: string;
    title: string;
    published_at: string | null;
    created_at: string;
}

const card: React.CSSProperties = {
    background: '#131924',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 18,
    padding: '24px',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
};

const btn = (color: string): React.CSSProperties => ({
    background: color,
    color: '#040914',
    border: 'none',
    borderRadius: 8,
    padding: '5px 14px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
});

const link: React.CSSProperties = { fontSize: 12, color: '#38bdf8', textDecoration: 'none' };
const muted: React.CSSProperties = { fontSize: 12, color: '#94a3b8', textDecoration: 'none' };

export default function AdminBlog({ posts }: { posts: Post[] }) {
    const publish   = (id: number) => router.post(`/admin/blog/${id}/publish`);
    const unpublish = (id: number) => router.post(`/admin/blog/${id}/unpublish`);
    const destroy   = (id: number) => { if (confirm('Удалить статью?')) router.delete(`/admin/blog/${id}`); };

    return (
        <AppLayout title="Админ — Блог">
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', margin: 0 }}>Статьи блога</h1>
                <span style={{ fontSize: 13, color: '#64748b' }}>{posts.length} статей</span>
                <a href="/admin/blog/new" style={link}>+ Новая статья</a>
            </div>

            {posts.length === 0 && (
                <div style={{ ...card, color: '#64748b', fontSize: 14 }}>
                    Нет статей. Создайте первую через редактор.
                </div>
            )}

            {posts.map((post) => (
                <div key={post.id} style={card}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {post.title}
                        </div>
                        <div style={{ fontSize: 12, color: '#475569' }}>/{post.slug}</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        <span style={{
                            fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                            background: post.published_at ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.15)',
                            color: post.published_at ? '#10b981' : '#64748b',
                        }}>
                            {post.published_at ? 'Опубликовано' : 'Черновик'}
                        </span>

                        <a href={`/admin/blog/${post.id}/edit`} style={muted}>Редактировать</a>

                        {post.published_at ? (
                            <>
                                <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" style={link}>Открыть →</a>
                                <button style={btn('#334155')} onClick={() => unpublish(post.id)}>Снять</button>
                            </>
                        ) : (
                            <>
                                <a href={`/admin/blog/${post.id}/preview`} target="_blank" rel="noreferrer" style={muted}>Предпросмотр →</a>
                                <button style={btn('#38bdf8')} onClick={() => publish(post.id)}>Опубликовать</button>
                            </>
                        )}

                        <button style={btn('#ef4444')} onClick={() => destroy(post.id)}>✕</button>
                    </div>
                </div>
            ))}
        </AppLayout>
    );
}
