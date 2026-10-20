<?php

use Illuminate\Support\Facades\Route;
use Nikv\Blog\Http\Controllers\Admin\BlogAdminController;

Route::get('/', [BlogAdminController::class, 'index'])->name('blog');
Route::get('/{id}/preview', [BlogAdminController::class, 'preview'])->name('blog.preview');
Route::get('/{id}/edit', [BlogAdminController::class, 'edit'])->name('blog.edit');
Route::post('/', [BlogAdminController::class, 'store'])->name('blog.store');
Route::patch('/{id}', [BlogAdminController::class, 'update'])->name('blog.update');
Route::post('/{id}/publish', [BlogAdminController::class, 'publish'])->name('blog.publish');
Route::post('/{id}/unpublish', [BlogAdminController::class, 'unpublish'])->name('blog.unpublish');
Route::delete('/{id}', [BlogAdminController::class, 'destroy'])->name('blog.destroy');
