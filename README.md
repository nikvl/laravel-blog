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

## Editor dependencies

In the host Laravel application's frontend directory, install the Tiptap 2 dependencies before building:

```bash
npm install @tiptap/core@^2 @tiptap/pm@^2 @tiptap/react@^2 @tiptap/starter-kit@^2 \
  @tiptap/extension-placeholder@^2 @tiptap/extension-image@^2 @tiptap/extension-code-block@^2 tiptap-markdown@^0.8
npm run build
```

For existing installations, merge the updated published pages, including `Admin/BlogMediaDialog.tsx`, `Admin/BlogMediaExtensions.tsx` and `Admin/blogMedia.ts`. Republishing with `--force` overwrites customized pages.

## Images and SVG / HTML previews

- **Изображение** inserts an image at the current cursor position: upload JPEG, PNG, WebP or GIF (up to 4 MB), or enter an HTTP(S) URL / root-relative path. An optional alt description is saved with the image.
- Uploads use `blog.image_disk` and the `blog-images` directory. For the `public` disk, run `php artisan storage:link` in the host app. Private disks use the same one-year temporary URL behavior as covers.
- **SVG / HTML** opens a source editor with a live preview. Inserted blocks can be edited or deleted from the article; undo is supported.
- Previews run in sandboxed iframes with a restrictive CSP: no JavaScript, external resources, form submissions or link navigation. Use inline CSS/SVG and data-URI images inside previews. Height is fixed at 480px with scrolling for larger content.
- Images and preview source survive Markdown import, saving and reopening. Ordinary `html` / `svg` code fences remain code, and raw HTML outside explicit preview fences is still stripped.

Markdown preview syntax:

````markdown
Before the diagram.

![Diagram description](/storage/blog-images/diagram.png)

```html-preview
<style>.note { padding: 24px; background: #e0f2fe; }</style>
<div class="note">Rendered HTML or inline SVG</div>
```

After the diagram.
````

## Development checks

```bash
composer install
composer test
npm install
npm test
```

PHP tests use Orchestra Testbench; editor tests exercise Markdown round-trips and preview isolation. This repository is a package, so a full app build and end-to-end checks require a host Laravel application. No standalone `build`, lint or PHPStan configuration is included.

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
- Images inside article text: file upload, URL and alt descriptions
- Sandboxed SVG / HTML previews with editable Markdown source
- Post covers via `public` disk or S3
- **Tags** — `spatie/laravel-tags` (optional)
- **Comments** — `beyondcode/laravel-comments` with auth guard and moderation queue (optional)
- **SEO** — `artesaos/seotools`, supports both Inertia `<Head>` and SSR injection (optional)
- **Analytics** — built-in view counter (deduplicated by IP) and outbound link click tracking (optional)

## Requirements

- PHP 8.2+ with the DOM extension
- Laravel 11 or 12
- Inertia.js (Laravel adapter ^2|^3)
