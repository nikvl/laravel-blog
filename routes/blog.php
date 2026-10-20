<?php

use Illuminate\Support\Facades\Route;
use Nikv\Blog\Http\Controllers\BlogController;
use Nikv\Blog\Http\Controllers\CommentController;

Route::get('/blog', [BlogController::class, 'index'])->name('blog.index');
Route::get('/blog/{slug}', [BlogController::class, 'show'])->name('blog.show');

if (config('blog.comments') === 'beyondcode') {
    Route::post('/blog/{slug}/comments', [CommentController::class, 'store'])
        ->middleware(config('blog.comments_require_auth') ? 'auth' : [])
        ->name('blog.comments.store');
}
