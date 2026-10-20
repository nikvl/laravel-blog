import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';

interface Post {
    id: number;
    slug: string;
    title: string;
    excerpt: string | null;
    markdown: string | null;
    author: string | null;
    cover_image: string | null;
    published_at: string | null;
}

function extractTitle(md: string): string {
    const m = md.match(/^#\s+(.+)$/m);
    return m ? m[1].trim() : '';
}

function extractExcerpt(md: string): string {
    const lines = md.split('\n');
    let pastTitle = false;
    const para: string[] = [];
    for (const line of lines) {
        const t = line.trim();
        if (!pastTitle) { if (t.startsWith('#')) pastTitle = true; continue; }
        if (t === '') { if (para.length) break; continue; }
        if (t.startsWith('#') || t.startsWith('|') || t.startsWith('-')) break;
        para.push(t.replace(/\*\*(.+?)\*\*/g, '$1'));
    }
    const text = para.join(' ');
    return text.length > 200 ? text.slice(0, 197) + '...' : text;
}

const inputStyle: React.CSSProperties = {
    width: '100%', background: '#0f1623', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '10px 12px', color: '#f8fafc', fontSize: 14, boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = { fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 };

export default function BlogEdit({ post }: { post: Post }) {
    const isNew = !post.id;
    const fileRef = useRef<HTMLInputElement>(null);
    const coverRef = useRef<HTMLInputElement>(null);

    const [title, setTitle]     = useState(post.title ?? '');
    const [slug, setSlug]       = useState(post.slug ?? '');
    const [excerpt, setExcerpt] = useState(post.excerpt ?? '');
    const [markdown, setMarkdown] = useState(post.markdown ?? '');
    const [author, setAuthor]   = useState(post.author ?? '');
    const [slugEdited, setSlugEdited] = useState(!isNew);

    function handleTitleChange(val: string) {
        setTitle(val);
        if (!slugEdited) setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }

    function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const md = ev.target?.result as string;
            const t = extractTitle(md);
            const ex = extractExcerpt(md);
            setMarkdown(md);
            if (t) { setTitle(t); if (!slugEdited) setSlug(t.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')); }
            if (ex) setExcerpt(ex);
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const form = new FormData();
        form.append('title', title);
        form.append('slug', slug);
        form.append('excerpt', excerpt);
        form.append('markdown', markdown);
        form.append('author', author);
        if (coverRef.current?.files?.[0]) form.append('cover', coverRef.current.files[0]);

        if (isNew) {
            router.post('/admin/blog', form);
        } else {
            form.append('_method', 'PATCH');
            router.post(`/admin/blog/${post.id}`, form);
        }
    }

    return (
        <AppLayout title={isNew ? 'Новая статья' : 'Редактировать статью'}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                        {isNew ? 'Новая статья' : 'Редактировать статью'}
                    </h1>
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        style={{ fontSize: 12, color: '#38bdf8', background: 'none', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}
                    >
                        Импорт .txt
                    </button>
                    <input ref={fileRef} type="file" accept=".txt,.md" style={{ display: 'none' }} onChange={handleImport} />
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                        <label style={labelStyle}>Заголовок *</label>
                        <input style={inputStyle} value={title} onChange={e => handleTitleChange(e.target.value)} required />
                    </div>

                    <div>
                        <label style={labelStyle}>Slug *</label>
                        <input style={inputStyle} value={slug} onChange={e => { setSlug(e.target.value); setSlugEdited(true); }} required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label style={labelStyle}>Автор</label>
                            <input style={inputStyle} value={author} onChange={e => setAuthor(e.target.value)} />
                        </div>
                        <div>
                            <label style={labelStyle}>Обложка</label>
                            <input ref={coverRef} type="file" accept="image/*" style={inputStyle} />
                            {post.cover_image && (
                                <img src={post.cover_image} alt="" style={{ marginTop: 8, height: 60, borderRadius: 6, objectFit: 'cover' }} />
                            )}
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Краткое описание</label>
                        <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} value={excerpt} onChange={e => setExcerpt(e.target.value)} />
                    </div>

                    <div>
                        <label style={labelStyle}>Текст (markdown) *</label>
                        <textarea style={{ ...inputStyle, height: 400, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} value={markdown} onChange={e => setMarkdown(e.target.value)} required />
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button type="submit" style={{ background: '#38bdf8', color: '#040914', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                            Сохранить
                        </button>
                        <a href="/admin/blog" style={{ fontSize: 14, color: '#64748b', textDecoration: 'none', lineHeight: '40px' }}>
                            Отмена
                        </a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
