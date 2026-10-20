<?php

declare(strict_types=1);

namespace Nikv\Blog;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Nikv\Blog\Console\BlogInstallCommand;

class BlogServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/blog.php', 'blog');
    }

    public function boot(): void
    {
        $this->registerRoutes();
        $this->registerPublishables();
        $this->configureOptionalPackages();

        if ($this->app->runningInConsole()) {
            $this->commands([BlogInstallCommand::class]);
        }
    }

    private function configureOptionalPackages(): void
    {
        if (config('blog.comments') === 'beyondcode') {
            config(['comments.comment_class' => \Nikv\Blog\Models\BlogComment::class]);
        }

        if (config('blog.tags') === 'spatie-tags') {
            config([
                'tags.tag_model'             => \Nikv\Blog\Models\BlogTag::class,
                'tags.taggable.table_name'   => 'blog_taggables',
            ]);
        }
    }

    private function registerRoutes(): void
    {
        Route::middleware('web')->group(__DIR__.'/../routes/blog.php');

        $prefix     = config('blog.admin_prefix', 'admin');
        $middleware = (array) config('blog.admin_middleware', ['auth']);

        Route::middleware(['web', ...$middleware])
            ->prefix($prefix.'/blog')
            ->name($prefix.'.')
            ->group(__DIR__.'/../routes/admin.php');
    }

    private function registerPublishables(): void
    {
        if (! $this->app->runningInConsole()) {
            return;
        }

        $this->publishes([
            __DIR__.'/../config/blog.php' => config_path('blog.php'),
        ], 'blog-config');

        $this->publishes([
            __DIR__.'/../database/migrations' => database_path('migrations'),
        ], 'blog-migrations');

        $this->publishes([
            __DIR__.'/../resources/js/Pages' => resource_path('js/Pages'),
        ], 'blog-views');
    }
}
