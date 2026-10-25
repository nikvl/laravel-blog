<?php

declare(strict_types=1);

namespace Nikv\Blog\Http\Controllers\Admin;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use League\CommonMark\CommonMarkConverter;
use Nikv\Blog\Models\BlogPost;

class BlogAdminController extends Controller
{
    public function index(): Response
    {
        $analyticsEnabled = config('blog.analytics') === 'simple';

        $query = BlogPost::orderByDesc('created_at')
            ->select(['id', 'slug', 'title', 'published_at', 'created_at']);

        if ($analyticsEnabled) {
            $query
                ->selectSub(
                    DB::table('blog_post_views')->whereColumn('post_id', 'blog_posts.id')->selectRaw('count(*)'),
                    'views_count'
                )
                ->selectSub(
                    DB::table('blog_post_link_clicks')->whereColumn('post_id', 'blog_posts.id')->selectRaw('count(*)'),
                    'clicks_count'
                );
        }

        try {
            $posts = $query->get();
        } catch (\Illuminate\Database\QueryException) {
            // analytics migration not yet run — fall back to basic list
            $posts = BlogPost::orderByDesc('created_at')
                ->select(['id', 'slug', 'title', 'published_at', 'created_at'])
                ->get();
            $analyticsEnabled = false;
        }

        return Inertia::render('Admin/Blog', [
            'posts'            => $posts,
            'analyticsEnabled' => $analyticsEnabled,
        ]);
    }

    public function preview(int $id): Response
    {
        $post = BlogPost::findOrFail($id, ['id', 'slug', 'title', 'excerpt', 'body', 'author', 'cover_image', 'published_at']);

        return Inertia::render('Blog/Show', ['post' => $post, 'isPreview' => true]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/BlogEdit', [
            'post' => [
                'id' => null, 'slug' => '', 'title' => '', 'excerpt' => null,
                'markdown' => null, 'author' => null, 'cover_image' => null, 'published_at' => null,
                'tags' => [],
            ],
            'tagsEnabled' => config('blog.tags') === 'spatie-tags',
        ]);
    }

    public function edit(int $id): Response
    {
        $post = BlogPost::when(
            config('blog.tags') === 'spatie-tags',
            fn ($q) => $q->with('tags')
        )->findOrFail($id);

        $data = $post->only(['id', 'slug', 'title', 'excerpt', 'markdown', 'author', 'cover_image', 'published_at']);
        $data['tags'] = config('blog.tags') === 'spatie-tags'
            ? $post->tags->pluck('name')->toArray()
            : [];

        return Inertia::render('Admin/BlogEdit', [
            'post'        => $data,
            'tagsEnabled' => config('blog.tags') === 'spatie-tags',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title'    => 'required|string|max:255',
            'slug'     => 'nullable|string|max:255|unique:blog_posts,slug',
            'excerpt'  => 'nullable|string',
            'markdown' => 'required|string',
            'author'   => 'nullable|string|max:255',
            'cover'    => 'nullable|image|max:4096',
            'tags'     => 'nullable|string',
        ]);

        $slug = $data['slug'] ?? Str::slug($data['title']);

        if (empty($slug)) {
            return back()->withErrors(['title' => 'Не удалось создать slug. Используйте латинские символы в заголовке.'])->withInput();
        }

        $body = $this->toHtml($data['markdown']);

        $post = BlogPost::create([
            'slug'        => $slug,
            'title'       => $data['title'],
            'excerpt'     => $data['excerpt'] ?? null,
            'body'        => $body,
            'markdown'    => $data['markdown'],
            'author'      => $data['author'] ?? null,
            'cover_image' => $this->storeCover($request),
        ]);

        if (config('blog.tags') === 'spatie-tags' && ! empty($data['tags'])) {
            $post->syncTags($this->parseTags($data['tags']));
        }

        return redirect()->route('admin.blog')->with('status', 'Статья создана');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $post = BlogPost::findOrFail($id);

        $data = $request->validate([
            'title'    => 'required|string|max:255',
            'slug'     => 'nullable|string|max:255|unique:blog_posts,slug,'.$id,
            'excerpt'  => 'nullable|string',
            'markdown' => 'required|string',
            'author'   => 'nullable|string|max:255',
            'cover'    => 'nullable|image|max:4096',
            'tags'     => 'nullable|string',
        ]);

        $body = $this->toHtml($data['markdown']);

        $post->update([
            'title'       => $data['title'],
            'slug'        => $data['slug'] ?? $post->slug,
            'excerpt'     => $data['excerpt'] ?? null,
            'body'        => $body,
            'markdown'    => $data['markdown'],
            'author'      => $data['author'] ?? null,
            'cover_image' => $this->storeCover($request) ?? $post->cover_image,
        ]);

        if (config('blog.tags') === 'spatie-tags') {
            $post->syncTags($this->parseTags($data['tags'] ?? ''));
        }

        return back()->with('status', 'Сохранено');
    }

    public function publish(int $id): RedirectResponse
    {
        BlogPost::findOrFail($id)->update(['published_at' => now()]);

        return back()->with('status', 'Статья опубликована');
    }

    public function unpublish(int $id): RedirectResponse
    {
        BlogPost::findOrFail($id)->update(['published_at' => null]);

        return back()->with('status', 'Статья снята с публикации');
    }

    public function destroy(int $id): RedirectResponse
    {
        BlogPost::findOrFail($id)->delete();

        return redirect()->route('admin.blog')->with('status', 'Статья удалена');
    }

    /** @return array<string> */
    private function parseTags(?string $raw): array
    {
        if (! $raw) {
            return [];
        }

        return array_values(array_filter(array_map('trim', explode(',', $raw))));
    }

    private function storeCover(Request $request): ?string
    {
        if (! $request->hasFile('cover')) {
            return null;
        }

        $disk = config('blog.image_disk', 'public');
        $path = config('blog.image_path', 'blog-covers');

        $stored = $request->file('cover')->store($path, $disk);

        if ($disk === 'public') {
            return Storage::disk($disk)->url((string) $stored);
        }

        return rescue(
            fn () => Storage::disk($disk)->temporaryUrl((string) $stored, now()->addYear()),
            fn () => Storage::disk($disk)->url((string) $stored),
        );
    }

    private function toHtml(string $markdown): string
    {
        return (new CommonMarkConverter([
            'html_input'         => 'strip',
            'allow_unsafe_links' => false,
        ]))->convert($markdown)->getContent();
    }
}
