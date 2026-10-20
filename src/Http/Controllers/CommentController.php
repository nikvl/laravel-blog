<?php

declare(strict_types=1);

namespace Nikv\Blog\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Nikv\Blog\Models\BlogComment;
use Nikv\Blog\Models\BlogPost;

class CommentController extends Controller
{
    public function store(Request $request, string $slug): RedirectResponse
    {
        if (config('blog.comments_require_auth') && ! auth()->check()) {
            abort(401);
        }

        $post = BlogPost::published()->where('slug', $slug)->firstOrFail();

        $data = $request->validate(['comment' => 'required|string|max:2000']);

        $comment = new BlogComment([
            'comment'     => $data['comment'],
            'is_approved' => ! config('blog.comments_moderation'),
            'user_id'     => auth()->id(),
        ]);

        $post->comments()->save($comment);

        $message = config('blog.comments_moderation')
            ? 'Комментарий отправлен на модерацию'
            : 'Комментарий добавлен';

        return back()->with('comment_status', $message);
    }
}
