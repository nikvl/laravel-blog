<?php

declare(strict_types=1);

namespace Nikv\Blog\Http\Controllers\Admin;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
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
        $posts = BlogPost::orderByDesc('created_at')
            ->select(['id', 'slug', 'title', 'published_at', 'created_at'])
            ->get();

        return Inertia::render('Admin/Blog', ['posts' => $posts]);
    }

    public function preview(int $id): Response
    {
        $post = BlogPost::findOrFail($id, ['slug', 'title', 'excerpt', 'body', 'author', 'cover_image', 'published_at']);

        return Inertia::render('Blog/Show', ['post' => $post, 'isPreview' => true]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/BlogEdit', ['post' => [
            'id' => null, 'slug' => '', 'title' => '', 'excerpt' => null,
            'markdown' => null, 'author' => null, 'cover_image' => null, 'published_at' => null,
        ]]);
    }

    public function edit(int $id): Response
    {
        $post = BlogPost::findOrFail($id, ['id', 'slug', 'title', 'excerpt', 'markdown', 'author', 'cover_image', 'published_at']);

        return Inertia::render('Admin/BlogEdit', ['post' => $post]);
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
        ]);

        $slug = $data['slug'] ?? Str::slug($data['title']);
        $body = (new CommonMarkConverter)->convert($data['markdown'])->getContent();

        BlogPost::create([
            'slug'        => $slug,
            'title'       => $data['title'],
            'excerpt'     => $data['excerpt'] ?? null,
            'body'        => $body,
            'markdown'    => $data['markdown'],
            'author'      => $data['author'] ?? null,
            'cover_image' => $this->storeCover($request),
        ]);

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
        ]);

        $body = (new CommonMarkConverter)->convert($data['markdown'])->getContent();

        $post->update([
            'title'       => $data['title'],
            'slug'        => $data['slug'] ?? $post->slug,
            'excerpt'     => $data['excerpt'] ?? null,
            'body'        => $body,
            'markdown'    => $data['markdown'],
            'author'      => $data['author'] ?? null,
            'cover_image' => $this->storeCover($request) ?? $post->cover_image,
        ]);

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

    private function storeCover(Request $request): ?string
    {
        if (! $request->hasFile('cover')) {
            return null;
        }

        $disk = config('blog.image_disk', 'public');
        $path = config('blog.image_path', 'blog-covers');

        $stored = $request->file('cover')->store($path, $disk);

        return $disk === 'public'
            ? Storage::disk($disk)->url((string) $stored)
            : Storage::disk($disk)->temporaryUrl((string) $stored, now()->addYear());
    }
}
