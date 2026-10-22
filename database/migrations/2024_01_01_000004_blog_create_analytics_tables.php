<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('blog_post_views')) {
            Schema::create('blog_post_views', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('post_id');
                $table->string('ip', 45);
                $table->date('date');
                $table->unique(['post_id', 'ip', 'date']);
            });
        }

        if (! Schema::hasTable('blog_post_link_clicks')) {
            Schema::create('blog_post_link_clicks', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('post_id');
                $table->string('ip', 45);
                $table->text('url');
                $table->char('url_hash', 64);
                $table->date('date');
                $table->unique(['post_id', 'ip', 'url_hash', 'date']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_post_link_clicks');
        Schema::dropIfExists('blog_post_views');
    }
};
