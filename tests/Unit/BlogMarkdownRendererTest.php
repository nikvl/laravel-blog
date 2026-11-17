<?php

declare(strict_types=1);

namespace Nikv\Blog\Tests\Unit;

use DOMDocument;
use Nikv\Blog\Support\BlogMarkdownRenderer;
use Nikv\Blog\Support\HtmlPreviewDocument;
use PHPUnit\Framework\TestCase;

final class BlogMarkdownRendererTest extends TestCase
{
    public function test_it_renders_images_between_paragraphs(): void
    {
        $html = (new BlogMarkdownRenderer())->render("Before\n\n![Diagram](/storage/blog-images/diagram.png)\n\nAfter");

        self::assertStringContainsString('<p>Before</p>', $html);
        self::assertStringContainsString('<img src="/storage/blog-images/diagram.png" alt="Diagram"', $html);
        self::assertStringContainsString('<p>After</p>', $html);
    }

    public function test_it_renders_only_explicit_preview_fences_as_sandboxed_frames(): void
    {
        $html = (new BlogMarkdownRenderer())->render("```html-preview\n<style>p{color:red}</style><p>Привет & мир</p>\n```\n\n```html\n<b>Code</b>\n```");
        $document = new DOMDocument();
        @$document->loadHTML($html);
        $frames = $document->getElementsByTagName('iframe');

        self::assertCount(1, $frames);
        self::assertTrue($frames->item(0)->hasAttribute('sandbox'));
        self::assertSame('allow-same-origin', $frames->item(0)->getAttribute('sandbox'));
        self::assertStringContainsString('background:transparent', $frames->item(0)->getAttribute('style'));
        self::assertStringNotContainsString('480px', $frames->item(0)->getAttribute('style'));
        self::assertSame('no-referrer', $frames->item(0)->getAttribute('referrerpolicy'));
        self::assertStringContainsString(HtmlPreviewDocument::CSP, $frames->item(0)->getAttribute('srcdoc'));
        self::assertStringContainsString('&lt;b&gt;Code&lt;/b&gt;', $html);
        self::assertSame(0, $document->getElementsByTagName('p')->length);
    }

    public function test_it_preserves_svg_and_strips_navigation_from_previews(): void
    {
        $html = HtmlPreviewDocument::make('<meta http-equiv="refresh" content="0;url=https://example.com"><base href="https://example.com"><a href="https://example.com">Link</a><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/><animate attributeName="href"/></svg><script>alert(1)</script>');

        self::assertStringContainsString('<svg', $html);
        self::assertStringContainsString('<circle', $html);
        self::assertStringNotContainsString('https://example.com', $html);
        self::assertStringNotContainsString('<script', $html);
        self::assertStringNotContainsString('<animate', $html);
        self::assertStringNotContainsString('http-equiv="refresh"', $html);
    }

    public function test_raw_html_and_unsafe_links_stay_disabled(): void
    {
        $html = (new BlogMarkdownRenderer())->render("<iframe src=\"https://example.com\"></iframe>\n\n[Bad](javascript:alert%281%29)\n\n![Bad](javascript:alert%281%29)");

        self::assertStringNotContainsString('<iframe', $html);
        self::assertStringNotContainsString('javascript:', $html);
    }

    public function test_it_preserves_full_document_styles_and_unicode(): void
    {
        $html = HtmlPreviewDocument::make('<!doctype html><html><head><style>.card{color:red}</style></head><body style="padding:32px"><div class="card">Привет &amp; мир</div></body></html>');

        self::assertStringContainsString('style="padding:32px"', $html);
        self::assertStringContainsString('.card{color:red}', $html);
        self::assertStringContainsString('Привет &amp; мир', $html);
    }

    public function test_preview_defaults_are_transparent_and_fit_content(): void
    {
        $html = HtmlPreviewDocument::make('<svg width="120" height="60"><rect width="120" height="60"/></svg>');

        self::assertStringContainsString('background:transparent', $html);
        self::assertStringContainsString('margin:0', $html);
        self::assertStringContainsString('width:fit-content', $html);
        self::assertStringNotContainsString('background:#fff', $html);
        self::assertStringContainsString("script-src 'none'", $html);
    }

    public function test_it_uses_viewbox_dimensions_without_replacing_explicit_svg_sizes(): void
    {
        $html = HtmlPreviewDocument::make('<svg viewBox="0 0 400 200"></svg><svg width="90" viewBox="0 0 400 200"></svg>');
        $document = new DOMDocument();
        @$document->loadHTML($html);
        $svgs = $document->getElementsByTagName('svg');

        self::assertSame('400', $svgs->item(0)->getAttribute('width'));
        self::assertSame('200', $svgs->item(0)->getAttribute('height'));
        self::assertSame('90', $svgs->item(1)->getAttribute('width'));
        self::assertFalse($svgs->item(1)->hasAttribute('height'));
    }

    public function test_an_empty_preview_is_a_valid_document(): void
    {
        self::assertStringContainsString('Content-Security-Policy', HtmlPreviewDocument::make(''));
    }
}
