<?php

declare(strict_types=1);

namespace Nikv\Blog\Console;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class BlogInstallCommand extends Command
{
    protected $signature = 'blog:install';

    protected $description = 'Publish blog assets, config, migrations and install npm dependencies';

    public function handle(): int
    {
        $this->call('vendor:publish', ['--tag' => 'blog-config', '--force' => false]);
        $this->call('vendor:publish', ['--tag' => 'blog-migrations', '--force' => false]);
        $this->call('vendor:publish', ['--tag' => 'blog-views', '--force' => true]);

        $this->info('Installing npm dependencies...');

        $packages = ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-placeholder', 'tiptap-markdown'];

        $process = new Process(['npm', 'install', ...$packages], base_path());
        $process->setTimeout(120);
        $process->run(fn ($type, $output) => $this->output->write($output));

        if (! $process->isSuccessful()) {
            $this->error('npm install failed. Run manually: npm install ' . implode(' ', $packages));
            return self::FAILURE;
        }

        $this->info('blog:install complete. Run: php artisan migrate');

        return self::SUCCESS;
    }
}
