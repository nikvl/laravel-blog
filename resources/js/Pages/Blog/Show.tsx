import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

interface Post {
    slug: string;
    title: string;
    excerpt: string | null;
    body: string;
    author: string | null;
    cover_image: string | null;
    published_at: string | null;
}

interface SharedProps {
    currentUrl: string;
    appUrl: string;
    [key: string]: unknown;
}

export default function BlogShow({ post, isPreview }: { post: Post; isPreview?: boolean }) {
    const { currentUrl, appUrl } = usePage<SharedProps>().props;
    const ogImage = post.cover_image ? `${appUrl}${post.cover_image}` : null;

    return (
        <AppLayout title={`${post.title} — Блог`} {...(post.excerpt ? { description: post.excerpt } : {})}>
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
            <Head>
                {ogImage && <meta property="og:image" content={ogImage} />}
                {ogImage && <meta name="twitter:image" content={ogImage} />}
                <meta property="og:type" content="article" />
                <meta property="og:url" content={currentUrl} />
                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Article',
                        headline: post.title,
                        description: post.excerpt,
                        author: { '@type': 'Person', name: post.author ?? '' },
                        datePublished: post.published_at,
                        url: currentUrl,
                        ...(ogImage ? { image: ogImage } : {}),
                    })}
                </script>
            </Head>

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
                    <div className="flex gap-3 text-sm" style={{ color: '#64748b' }}>
                        {post.published_at && (
                            <span>{post.published_at.slice(0, 10).split('-').reverse().join('.')}</span>
                        )}
                        {post.author && <span>· {post.author}</span>}
                    </div>
                </header>

                <div
                    className="prose prose-invert max-w-none text-sm leading-relaxed"
                    style={{ color: '#cbd5e1' }}
                    dangerouslySetInnerHTML={{ __html: post.body }}
                />

                <div className="mt-12 border-t pt-6" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    <a href="/blog" className="text-sm" style={{ color: '#38bdf8' }}>
                        ← Все статьи
                    </a>
                </div>
            </article>
        </AppLayout>
    );
}
