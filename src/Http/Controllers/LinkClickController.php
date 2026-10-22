<?php

declare(strict_types=1);

namespace Nikv\Blog\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class LinkClickController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'post_id' => 'required|integer|exists:blog_posts,id',
            'url'     => 'required|string|max:2048',
        ]);

        DB::table('blog_post_link_clicks')->insertOrIgnore([
            'post_id'  => $data['post_id'],
            'ip'       => $request->ip(),
            'url'      => $data['url'],
            'url_hash' => hash('sha256', $data['url']),
            'date'     => now()->toDateString(),
        ]);

        return response()->json(['ok' => true]);
    }
}
