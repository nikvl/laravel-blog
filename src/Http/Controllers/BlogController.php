<?php

declare(strict_types=1);

namespace Nikv\Blog\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Nikv\Blog\Models\BlogPost;

class BlogController extends Controller
{
    public function index(): Response
    {
        $posts = BlogPost::published()
            ->orderByDesc('published_at')
            ->select(['slug', 'title', 'excerpt', 'cover_image', 'author', 'published_at'])
            ->when(config('blog.tags') === 'spatie-tags', fn ($q) => $q->with('tags'))
            ->paginate(12);

        return Inertia::render('Blog/Index', ['posts' => $posts]);
    }

    public function show(string $slug): Response
    {
        $query = BlogPost::published()->where('slug', $slug);

        if (config('blog.tags') === 'spatie-tags') {
            $query->with('tags');
        }

        if (config('blog.comments') === 'beyondcode') {
            $query->with(['comments' => fn ($q) => $q->where('is_approved', true)->latest()]);
        }

        $post = $query->firstOrFail();

        if (config('blog.analytics') === 'simple') {
            try {
                DB::table('blog_post_views')->insertOrIgnore([
                    'post_id' => $post->id,
                    'ip'      => request()->ip(),
                    'date'    => now()->toDateString(),
                ]);
            } catch (\Illuminate\Database\QueryException) {
                // analytics migration not yet run — degrade gracefully
            }
        }

        $seo = null;
        if (config('blog.seo') === 'artesaos') {
            $seoTools = app('seotools');
            $seoTools->setTitle($post->title);
            $seoTools->setDescription($post->excerpt ?? '');
            $seoTools->opengraph()->setUrl(request()->url());
            $seoTools->opengraph()->setTitle($post->title);
            if ($post->cover_image) {
                $seoTools->opengraph()->addImage($post->cover_image);
                $seoTools->twitter()->addImage($post->cover_image);
            }

            if (! config('blog.seo_ssr')) {
                $seo = [
                    'title'       => $post->title,
                    'description' => $post->excerpt,
                    'og_image'    => $post->cover_image,
                    'url'         => request()->url(),
                ];
            }
        }

        return Inertia::render('Blog/Show', [
            'post'                 => $post,
            'seo'                  => $seo,
            'commentsEnabled'      => config('blog.comments') === 'beyondcode',
            'commentsRequireAuth'  => config('blog.comments_require_auth'),
            'commentsModerationOn' => config('blog.comments_moderation'),
            'analyticsEnabled'     => config('blog.analytics') === 'simple',
        ]);
    }
}
