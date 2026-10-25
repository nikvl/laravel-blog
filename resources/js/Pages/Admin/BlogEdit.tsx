import { router } from '@inertiajs/react';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useRef, useState } from 'react';
import { Markdown } from 'tiptap-markdown';
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
    tags?: string[];
}

interface PageProps {
    post: Post;
    tagsEnabled?: boolean;
}

function toSlug(val: string): string {
    return val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function extractTitle(md: string): string {
    const m = md.match(/^#\s+(.+)$/m);
    return m ? (m[1] ?? '').trim() : '';
}

function extractExcerpt(md: string): string {
    const lines = md.split('\n');
    let pastTitle = false;
    const para: string[] = [];
    for (const line of lines) {
        const t = line.trim();
        if (!pastTitle) {
            if (t.startsWith('#')) pastTitle = true;
            continue;
        }
        if (t === '') {
            if (para.length) break;
            continue;
        }
        if (t.startsWith('#') || t.startsWith('|') || t.startsWith('-')) break;
        para.push(t.replace(/\*\*(.+?)\*\*/g, '$1'));
    }
    const text = para.join(' ');
    return text.length > 200 ? text.slice(0, 197) + '...' : text;
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#0f1623',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '10px 12px',
    color: '#f8fafc',
    fontSize: 14,
    boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = { fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 };

const toolbarBtnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'rgba(56,189,248,0.15)' : 'none',
    border: '1px solid ' + (active ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.1)'),
    borderRadius: 6,
    color: active ? '#38bdf8' : '#94a3b8',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 9px',
});

export default function BlogEdit({ post, tagsEnabled }: PageProps) {
    const isNew = !post.id;
    const fileRef = useRef<HTMLInputElement>(null);
    const coverRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState(post.title ?? '');
    const [slug, setSlug] = useState(post.slug ?? '');
    const [excerpt, setExcerpt] = useState(post.excerpt ?? '');
    const [author, setAuthor] = useState(post.author ?? '');
    const [tags, setTags] = useState((post.tags ?? []).join(', '));
    const [submitting, setSubmitting] = useState(false);
    const [slugEdited, setSlugEdited] = useState(!isNew);

    const editor = useEditor({
        extensions: [StarterKit, Markdown, Placeholder.configure({ placeholder: 'Начните писать...' })],
        content: post.markdown ?? '',
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none',
                style: 'min-height:400px;padding:14px 16px;background:#0f1623;border:1px solid rgba(255,255,255,0.1);border-top:none;border-radius:0 0 8px 8px;',
            },
        },
    });

    const active = useEditorState({
        editor,
        selector: (ctx) => ({
            bold: ctx.editor?.isActive('bold') ?? false,
            italic: ctx.editor?.isActive('italic') ?? false,
            strike: ctx.editor?.isActive('strike') ?? false,
            code: ctx.editor?.isActive('code') ?? false,
            h1: ctx.editor?.isActive('heading', { level: 1 }) ?? false,
            h2: ctx.editor?.isActive('heading', { level: 2 }) ?? false,
            h3: ctx.editor?.isActive('heading', { level: 3 }) ?? false,
            bulletList: ctx.editor?.isActive('bulletList') ?? false,
            orderedList: ctx.editor?.isActive('orderedList') ?? false,
            blockquote: ctx.editor?.isActive('blockquote') ?? false,
            codeBlock: ctx.editor?.isActive('codeBlock') ?? false,
        }),
    });

    function handleTitleChange(val: string) {
        setTitle(val);
        if (!slugEdited) setSlug(toSlug(val));
    }

    function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const md = ev.target?.result as string;
            const t = extractTitle(md);
            const ex = extractExcerpt(md);
            editor?.commands.setContent(md);
            if (t) {
                setTitle(t);
                if (!slugEdited) setSlug(toSlug(t));
            }
            if (ex) setExcerpt(ex);
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (submitting) return;
        const editorStorage = editor?.storage as { markdown?: { getMarkdown: () => string } } | undefined;
        const markdown = editorStorage?.markdown?.getMarkdown() ?? '';
        const form = new FormData();
        form.append('title', title);
        form.append('slug', slug);
        form.append('excerpt', excerpt);
        form.append('markdown', markdown);
        form.append('author', author);
        if (tagsEnabled) form.append('tags', tags);
        if (coverRef.current?.files?.[0]) form.append('cover', coverRef.current.files[0]);

        setSubmitting(true);
        const opts = { onFinish: () => setSubmitting(false) };

        if (isNew) {
            router.post('/admin/blog', form, opts);
        } else {
            form.append('_method', 'PATCH');
            router.post(`/admin/blog/${post.id}`, form, opts);
        }
    }

    return (
        <AppLayout title={isNew ? 'Новая статья' : 'Редактировать статью'}>
            <div style={{ maxWidth: 860, margin: '0 auto' }}>
                <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                        {isNew ? 'Новая статья' : 'Редактировать статью'}
                    </h1>
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        style={{
                            fontSize: 12,
                            color: '#38bdf8',
                            background: 'none',
                            border: '1px solid rgba(56,189,248,0.3)',
                            borderRadius: 6,
                            padding: '4px 12px',
                            cursor: 'pointer',
                        }}
                    >
                        Импорт .md
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".txt,.md"
                        style={{ display: 'none' }}
                        onChange={handleImport}
                    />
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                        <label style={labelStyle}>Заголовок *</label>
                        <input
                            style={inputStyle}
                            value={title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Slug *</label>
                        <input
                            style={inputStyle}
                            value={slug}
                            onChange={(e) => {
                                setSlug(e.target.value);
                                setSlugEdited(true);
                            }}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label style={labelStyle}>Автор</label>
                            <input style={inputStyle} value={author} onChange={(e) => setAuthor(e.target.value)} />
                        </div>
                        <div>
                            <label style={labelStyle}>Обложка</label>
                            <input ref={coverRef} type="file" accept="image/*" style={inputStyle} />
                            {post.cover_image && (
                                <img
                                    src={post.cover_image}
                                    alt=""
                                    style={{ marginTop: 8, height: 60, borderRadius: 6, objectFit: 'cover' }}
                                />
                            )}
                        </div>
                    </div>

                    {tagsEnabled && (
                        <div>
                            <label style={labelStyle}>Теги (через запятую)</label>
                            <input
                                style={inputStyle}
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="laravel, php, tutorial"
                            />
                        </div>
                    )}

                    <div>
                        <label style={labelStyle}>Краткое описание</label>
                        <textarea
                            style={{ ...inputStyle, height: 80, resize: 'vertical' }}
                            value={excerpt}
                            onChange={(e) => setExcerpt(e.target.value)}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Текст *</label>
                        {editor && (
                            <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 4,
                                        padding: '8px 10px',
                                        borderBottom: '1px solid rgba(255,255,255,0.07)',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <button
                                        type="button"
                                        style={toolbarBtnStyle(active?.bold ?? false)}
                                        onClick={() => editor.chain().focus().toggleBold().run()}
                                    >
                                        B
                                    </button>
                                    <button
                                        type="button"
                                        style={toolbarBtnStyle(active?.italic ?? false)}
                                        onClick={() => editor.chain().focus().toggleItalic().run()}
                                    >
                                        I
                                    </button>
                                    <button
                                        type="button"
                                        style={toolbarBtnStyle(active?.strike ?? false)}
                                        onClick={() => editor.chain().focus().toggleStrike().run()}
                                    >
                                        S
                                    </button>
                                    <button
                                        type="button"
                                        style={toolbarBtnStyle(active?.code ?? false)}
                                        onClick={() => editor.chain().focus().toggleCode().run()}
                                    >
                                        {'<>'}
                                    </button>
                                    <span
                                        style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '2px 4px' }}
                                    />
                                    <button
                                        type="button"
                                        style={toolbarBtnStyle(active?.h1 ?? false)}
                                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                                    >
                                        H1
                                    </button>
                                    <button
                                        type="button"
                                        style={toolbarBtnStyle(active?.h2 ?? false)}
                                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                                    >
                                        H2
                                    </button>
                                    <button
                                        type="button"
                                        style={toolbarBtnStyle(active?.h3 ?? false)}
                                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                                    >
                                        H3
                                    </button>
                                    <span
                                        style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '2px 4px' }}
                                    />
                                    <button
                                        type="button"
                                        style={toolbarBtnStyle(active?.bulletList ?? false)}
                                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                                    >
                                        • List
                                    </button>
                                    <button
                                        type="button"
                                        style={toolbarBtnStyle(active?.orderedList ?? false)}
                                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                    >
                                        1. List
                                    </button>
                                    <button
                                        type="button"
                                        style={toolbarBtnStyle(active?.blockquote ?? false)}
                                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                                    >
                                        &quot;
                                    </button>
                                    <button
                                        type="button"
                                        style={toolbarBtnStyle(active?.codeBlock ?? false)}
                                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                                    >
                                        ```
                                    </button>
                                    <span
                                        style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '2px 4px' }}
                                    />
                                    <button
                                        type="button"
                                        style={toolbarBtnStyle(false)}
                                        onClick={() => editor.chain().focus().undo().run()}
                                    >
                                        ↩
                                    </button>
                                    <button
                                        type="button"
                                        style={toolbarBtnStyle(false)}
                                        onClick={() => editor.chain().focus().redo().run()}
                                    >
                                        ↪
                                    </button>
                                </div>
                                <EditorContent editor={editor} />
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                background: '#38bdf8',
                                color: '#040914',
                                border: 'none',
                                borderRadius: 8,
                                padding: '10px 24px',
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                opacity: submitting ? 0.7 : 1,
                            }}
                        >
                            {submitting ? 'Сохранение...' : 'Сохранить'}
                        </button>
                        <a
                            href="/admin/blog"
                            style={{ fontSize: 14, color: '#64748b', textDecoration: 'none', lineHeight: '40px' }}
                        >
                            Отмена
                        </a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
