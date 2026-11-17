<?php

declare(strict_types=1);

namespace Nikv\Blog\Support;

use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\Extension\CommonMark\Node\Block\FencedCode;
use League\CommonMark\MarkdownConverter;

final class BlogMarkdownRenderer
{
    public function render(string $markdown): string
    {
        $environment = new Environment([
            'html_input' => 'strip',
            'allow_unsafe_links' => false,
        ]);
        $environment->addExtension(new CommonMarkCoreExtension());
        $environment->addRenderer(FencedCode::class, new HtmlPreviewRenderer(), 10);

        return (new MarkdownConverter($environment))->convert($markdown)->getContent();
    }
}
