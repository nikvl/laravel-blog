import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';

interface Tag {
    name: string;
}
interface Comment {
    id: number;
    comment: string;
    user_id: number | null;
    created_at: string;
}

interface Post {
    id: number;
    slug: string;
    title: string;
    excerpt: string | null;
    body: string;
    author: string | null;
    cover_image: string | null;
    published_at: string | null;
    tags?: Tag[];
    comments?: Comment[];
}

interface Seo {
    title: string;
    description: string | null;
    og_image: string | null;
    url: string;
}

interface SharedProps {
    auth?: { user?: { name: string } };
    [key: string]: unknown;
}

export default function BlogShow({
    post,
    isPreview,
    seo,
    commentsEnabled,
    commentsRequireAuth,
    commentsModerationOn,
    analyticsEnabled,
}: {
    post: Post;
    isPreview?: boolean;
    seo?: Seo | null;
    commentsEnabled?: boolean;
    commentsRequireAuth?: boolean;
    commentsModerationOn?: boolean;
    analyticsEnabled?: boolean;
}) {
    const { auth } = usePage<SharedProps>().props;
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const bodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!analyticsEnabled || isPreview || !bodyRef.current) return;
        const el = bodyRef.current;
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
        const onClick = (e: MouseEvent) => {
            const a = (e.target as HTMLElement).closest('a');
            if (!a?.href) return;
            navigator.sendBeacon(
                '/blog/links/click',
                new Blob(
                    [JSON.stringify({ post_id: post.id, url: a.href, _token: token })],
                    { type: 'application/json' },
                ),
            );
        };
        el.addEventListener('click', onClick);
        return () => el.removeEventListener('click', onClick);
    }, [post.id, analyticsEnabled, isPreview]);

    const canComment = commentsEnabled && (!commentsRequireAuth || auth?.user);

    function submitComment(e: React.FormEvent) {
        e.preventDefault();
        if (!comment.trim()) return;
        setSubmitting(true);
        router.post(
            `/blog/${post.slug}/comments`,
            { comment },
            {
                onFinish: () => {
                    setSubmitting(false);
                    setComment('');
                },
            },
        );
    }

    return (
        <AppLayout
            title={seo?.title ?? `${post.title} — Блог`}
            {...((seo?.description ?? post.excerpt) ? { description: seo?.description ?? post.excerpt ?? '' } : {})}
        >
            {seo && (
                <Head>
                    <meta property="og:title" content={seo.title} />
                    {seo.description && <meta property="og:description" content={seo.description} />}
                    {seo.og_image && <meta property="og:image" content={seo.og_image} />}
                    {seo.og_image && <meta name="twitter:image" content={seo.og_image} />}
                    <meta property="og:type" content="article" />
                    <meta property="og:url" content={seo.url} />
                </Head>
            )}

            {isPreview && (
                <div
                    style={{
                        background: 'rgba(251,191,36,0.1)',
                        border: '1px solid rgba(251,191,36,0.3)',
                        borderRadius: 10,
                        padding: '10px 16px',
                        marginBottom: 24,
                        fontSize: 13,
                        color: '#fbbf24',
                    }}
                >
                    ⚠ Предпросмотр — статья ещё не опубликована
                </div>
            )}

            <article className="mx-auto max-w-3xl">
                {post.cover_image && (
                    <img
                        src={post.cover_image}
                        alt={post.title}
                        className="mb-8 w-full rounded-xl"
                        style={{ maxHeight: '400px', objectFit: 'cover' }}
                    />
                )}

                <header className="mb-8">
                    <h1 className="mb-3 text-3xl font-bold" style={{ letterSpacing: '-0.02em' }}>
                        {post.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: '#64748b' }}>
                        {post.published_at && (
                            <span>{post.published_at.slice(0, 10).split('-').reverse().join('.')}</span>
                        )}
                        {post.author && <span>· {post.author}</span>}
                    </div>
                    {post.tags && post.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {post.tags.map((tag) => (
                                <span
                                    key={tag.name}
                                    style={{
                                        background: 'rgba(56,189,248,0.1)',
                                        border: '1px solid rgba(56,189,248,0.2)',
                                        borderRadius: 6,
                                        color: '#38bdf8',
                                        fontSize: 12,
                                        padding: '2px 10px',
                                    }}
                                >
                                    {tag.name}
                                </span>
                            ))}
                        </div>
                    )}
                </header>

                <div
                    ref={bodyRef}
                    className="prose prose-invert max-w-none text-sm leading-relaxed"
                    style={{ color: '#cbd5e1' }}
                    dangerouslySetInnerHTML={{ __html: post.body }}
                />

                <div className="mt-12 border-t pt-6" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    <a href="/blog" className="text-sm" style={{ color: '#38bdf8' }}>
                        ← Все статьи
                    </a>
                </div>

                {commentsEnabled && (
                    <section className="mt-12">
                        <h2 className="mb-6 text-xl font-semibold">Комментарии</h2>

                        {post.comments && post.comments.length > 0 ? (
                            <div className="flex flex-col gap-4 mb-8">
                                {post.comments.map((c) => (
                                    <div
                                        key={c.id}
                                        style={{
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.07)',
                                            borderRadius: 10,
                                            padding: '12px 16px',
                                        }}
                                    >
                                        <p className="text-sm" style={{ color: '#cbd5e1' }}>
                                            {c.comment}
                                        </p>
                                        <span className="text-xs mt-2 block" style={{ color: '#475569' }}>
                                            {c.created_at.slice(0, 10)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="mb-8 text-sm" style={{ color: '#475569' }}>
                                Комментариев пока нет.
                            </p>
                        )}

                        {canComment ? (
                            <form onSubmit={submitComment} className="flex flex-col gap-3">
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Ваш комментарий..."
                                    rows={4}
                                    required
                                    style={{
                                        width: '100%',
                                        background: '#0f1623',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 8,
                                        padding: '10px 12px',
                                        color: '#f8fafc',
                                        fontSize: 14,
                                        resize: 'vertical',
                                        boxSizing: 'border-box',
                                    }}
                                />
                                <div className="flex items-center gap-3">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        style={{
                                            background: '#38bdf8',
                                            color: '#040914',
                                            border: 'none',
                                            borderRadius: 8,
                                            padding: '8px 20px',
                                            fontSize: 14,
                                            fontWeight: 600,
                                            cursor: submitting ? 'not-allowed' : 'pointer',
                                            opacity: submitting ? 0.7 : 1,
                                        }}
                                    >
                                        Отправить
                                    </button>
                                    {commentsModerationOn && (
                                        <span className="text-xs" style={{ color: '#475569' }}>
                                            Комментарий появится после модерации
                                        </span>
                                    )}
                                </div>
                            </form>
                        ) : commentsRequireAuth ? (
                            <p className="text-sm" style={{ color: '#475569' }}>
                                <a href="/login" style={{ color: '#38bdf8' }}>
                                    Войдите
                                </a>
                                , чтобы оставить комментарий.
                            </p>
                        ) : null}
                    </section>
                )}
            </article>
        </AppLayout>
    );
}
