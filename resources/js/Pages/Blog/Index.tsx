import AppLayout from '@/Layouts/AppLayout';

interface Post {
    slug: string;
    title: string;
    excerpt: string | null;
    cover_image: string | null;
    author: string | null;
    published_at: string;
}

interface PaginatedPosts {
    data: Post[];
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

export default function BlogIndex({ posts }: { posts: PaginatedPosts }) {
    return (
        <AppLayout title="Блог">
            <div className="mx-auto max-w-3xl space-y-8">
                <h1 className="text-3xl font-bold" style={{ letterSpacing: '-0.02em' }}>
                    Блог
                </h1>

                {posts.data.length === 0 ? (
                    <p className="text-sm" style={{ color: '#64748b' }}>
                        Статьи скоро появятся
                    </p>
                ) : (
                    <div className="space-y-6">
                        {posts.data.map((post) => (
                            <article
                                key={post.slug}
                                className="overflow-hidden rounded-xl"
                                style={{ background: '#131924', border: '1px solid rgba(255,255,255,0.07)' }}
                            >
                                {post.cover_image && (
                                    <a href={`/blog/${post.slug}`}>
                                        <img
                                            src={post.cover_image}
                                            alt={post.title}
                                            style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }}
                                        />
                                    </a>
                                )}
                                <div className="p-6">
                                    <a href={`/blog/${post.slug}`}>
                                        <h2
                                            className="mb-2 text-xl font-semibold hover:text-[#38bdf8]"
                                            style={{ letterSpacing: '-0.01em' }}
                                        >
                                            {post.title}
                                        </h2>
                                    </a>
                                    {post.excerpt && (
                                        <p className="mb-3 text-sm" style={{ color: '#94a3b8' }}>
                                            {post.excerpt}
                                        </p>
                                    )}
                                    <div className="flex gap-3 text-xs" style={{ color: '#64748b' }}>
                                        <span>{post.published_at.slice(0, 10).split('-').reverse().join('.')}</span>
                                        {post.author && <span>· {post.author}</span>}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                <div className="flex gap-4">
                    {posts.prev_page_url && (
                        <a href={posts.prev_page_url} className="text-sm" style={{ color: '#38bdf8' }}>
                            ← Предыдущие
                        </a>
                    )}
                    {posts.next_page_url && (
                        <a href={posts.next_page_url} className="ml-auto text-sm" style={{ color: '#38bdf8' }}>
                            Следующие →
                        </a>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
