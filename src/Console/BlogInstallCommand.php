<?php

declare(strict_types=1);

namespace Nikv\Blog\Console;

use Illuminate\Console\Command;

class BlogInstallCommand extends Command
{
    protected $signature = 'blog:install';

    protected $description = 'Publish blog config, migrations and views';

    public function handle(): int
    {
        $this->call('vendor:publish', ['--tag' => 'blog-config', '--force' => false]);
        $this->call('vendor:publish', ['--tag' => 'blog-migrations', '--force' => false]);
        $this->call('vendor:publish', ['--tag' => 'blog-views', '--force' => true]);

        $this->info('Next steps:');
        $this->line('  php artisan migrate');
        $this->line('  npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder tiptap-markdown');

        return self::SUCCESS;
    }
}
