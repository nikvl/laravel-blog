<?php

declare(strict_types=1);

namespace Nikv\Blog\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;

final class BlogImageController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|file|image|mimes:jpg,jpeg,png,gif,webp|max:4096',
        ]);

        $disk = config('blog.image_disk', 'public');
        $path = $request->file('image')->store('blog-images', $disk);
        abort_if($path === false, 500, 'Не удалось сохранить изображение.');

        $url = $disk === 'public'
            ? Storage::disk($disk)->url($path)
            : rescue(
                fn () => Storage::disk($disk)->temporaryUrl($path, now()->addYear()),
                fn () => Storage::disk($disk)->url($path),
            );

        return response()->json(['url' => $url], 201);
    }
}
