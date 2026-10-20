# nikv/blog

Laravel blog package with Inertia/React frontend.

## Installation

```bash
composer require nikv/blog
```

Publish config, migrations and frontend:

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
    'seo'      => null, // null | 'artesaos'
];
```

## Optional packages

| Config value | Package |
|---|---|
| `tags => 'spatie-tags'` | `spatie/laravel-tags` |
| `comments => 'beyondcode'` | `beyondcode/laravel-comments` |
| `seo => 'artesaos'` | `artesaos/seotools` |
