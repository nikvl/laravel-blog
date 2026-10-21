<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('blog_tags')) {
            return;
        }

        if (Schema::hasTable('tags')) {
            Schema::rename('tags', 'blog_tags');
            if (Schema::hasTable('taggables')) {
                Schema::rename('taggables', 'blog_taggables');
            }

            return;
        }

        Schema::create('blog_tags', function (Blueprint $table) {
            $table->id();
            $table->json('name');
            $table->json('slug');
            $table->string('type')->nullable();
            $table->integer('order_column')->nullable();
            $table->timestamps();
        });

        Schema::create('blog_taggables', function (Blueprint $table) {
            $table->foreignId('tag_id')->constrained('blog_tags')->cascadeOnDelete();
            $table->morphs('taggable');
            $table->unique(['tag_id', 'taggable_id', 'taggable_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_taggables');
        Schema::dropIfExists('blog_tags');
    }
};
