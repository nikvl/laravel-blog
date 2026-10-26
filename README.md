# nikv/blog

Laravel blog package with Inertia/React frontend.

## Installation

```bash
composer require nikv/blog
php artisan blog:install
php artisan migrate
```

Or manually publish assets:

```bash
php artisan vendor:publish --tag=blog-config
php artisan vendor:publish --tag=blog-migrations
php artisan vendor:publish --tag=blog-views
php artisan migrate
```

## Config

`config/blog.php`:

```php
return [
    'admin_prefix'     => 'admin',
    'admin_middleware' => ['auth'],

    'image_disk' => env('BLOG_IMAGE_DISK', 'public'),
    'image_path' => 'blog-covers',

    'tags'     => null, // null | 'spatie-tags'
    'comments' => null, // null | 'beyondcode'
    'comments_require_auth' => true,  // require auth to post a comment
    'comments_moderation'   => true,  // comments need approval before showing

    'seo'     => null, // null | 'artesaos'
    'seo_ssr' => false, // false = Inertia props → <Head>; true = middleware injects into <head>

    'analytics' => null, // null | 'simple'  (view counter + link click tracking)
];
```

## Optional packages

| Config value | Package |
|---|---|
| `tags => 'spatie-tags'` | `spatie/laravel-tags` |
| `comments => 'beyondcode'` | `beyondcode/laravel-comments` |
| `seo => 'artesaos'` | `artesaos/seotools` |

## Features

- Public blog routes (list, single post) and admin CRUD
- WYSIWYG editor (Tiptap) with Markdown output and `.txt` / `.md` import
- Post covers via `public` disk or S3
- **Tags** — `spatie/laravel-tags` (optional)
- **Comments** — `beyondcode/laravel-comments` with auth guard and moderation queue (optional)
- **SEO** — `artesaos/seotools`, supports both Inertia `<Head>` and SSR injection (optional)
- **Analytics** — built-in view counter (deduplicated by IP) and outbound link click tracking (optional)

## Requirements

- PHP 8.2+
- Laravel 11 or 12
- Inertia.js (Laravel adapter ^2|^3)
