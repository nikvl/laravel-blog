<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('blog_posts', 'markdown')) {
            return;
        }

        Schema::table('blog_posts', function (Blueprint $table) {
            $table->longText('markdown')->nullable()->after('body');
        });
    }

    public function down(): void
    {
        Schema::table('blog_posts', function (Blueprint $table) {
            $table->dropColumn('markdown');
        });
    }
};
