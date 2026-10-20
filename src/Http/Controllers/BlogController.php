<?php

declare(strict_types=1);

namespace Nikv\Blog\Http\Controllers;

use Illuminate\Routing\Controller;
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
            ->paginate(12);

        return Inertia::render('Blog/Index', ['posts' => $posts]);
    }

    public function show(string $slug): Response
    {
        $post = BlogPost::published()
            ->where('slug', $slug)
            ->firstOrFail(['slug', 'title', 'excerpt', 'body', 'author', 'cover_image', 'published_at']);

        return Inertia::render('Blog/Show', ['post' => $post]);
    }
}
