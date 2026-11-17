<?php

declare(strict_types=1);

namespace Nikv\Blog\Tests\Feature;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Nikv\Blog\BlogServiceProvider;
use Orchestra\Testbench\TestCase;

final class BlogImageUploadTest extends TestCase
{
    protected function getPackageProviders($app): array
    {
        return [BlogServiceProvider::class];
    }

    protected function defineEnvironment($app): void
    {
        $app['config']->set('app.key', 'base64:'.base64_encode(str_repeat('a', 32)));
        $app['config']->set('blog.admin_prefix', 'manage');
        $app['config']->set('blog.admin_middleware', ['auth']);
        $app['config']->set('session.driver', 'array');
    }

    public function test_upload_requires_authentication(): void
    {
        $this->postJson('/manage/blog/images')->assertUnauthorized();
    }

    public function test_it_uploads_a_raster_image_to_the_configured_disk(): void
    {
        Storage::fake('public');
        $this->withoutMiddleware(\Illuminate\Auth\Middleware\Authenticate::class);

        $image = UploadedFile::fake()->createWithContent('diagram.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6yS8AAAAASUVORK5CYII='));
        $response = $this->postJson('/manage/blog/images', ['image' => $image]);

        $response->assertCreated()->assertJsonStructure(['url']);
        Storage::disk('public')->assertExists('blog-images/'.$image->hashName());
        self::assertStringContainsString('/storage/blog-images/', $response->json('url'));
        self::assertSame(url('/manage/blog/images'), route('manage.blog.images.store'));
    }

    public function test_it_rejects_svg_and_other_non_raster_files(): void
    {
        Storage::fake('public');
        $this->withoutMiddleware(\Illuminate\Auth\Middleware\Authenticate::class);

        $this->postJson('/manage/blog/images', [
            'image' => UploadedFile::fake()->createWithContent('diagram.svg', '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>'),
        ])->assertUnprocessable()->assertJsonValidationErrors('image');
        $this->postJson('/manage/blog/images', [
            'image' => UploadedFile::fake()->createWithContent('fake.png', '<html>Not an image</html>')->mimeType('text/html'),
        ])->assertUnprocessable()->assertJsonValidationErrors('image');

        self::assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_it_rejects_missing_and_oversized_files(): void
    {
        $this->withoutMiddleware(\Illuminate\Auth\Middleware\Authenticate::class);

        $this->postJson('/manage/blog/images')->assertUnprocessable()->assertJsonValidationErrors('image');
        $this->postJson('/manage/blog/images', [
            'image' => UploadedFile::fake()->create('large.png', 4097, 'image/png'),
        ])->assertUnprocessable()->assertJsonValidationErrors('image');
    }
}
