<?php

declare(strict_types=1);

namespace Nikv\Blog\Support;

use League\CommonMark\Extension\CommonMark\Node\Block\FencedCode;
use League\CommonMark\Extension\CommonMark\Renderer\Block\FencedCodeRenderer;
use League\CommonMark\Node\Node;
use League\CommonMark\Renderer\ChildNodeRendererInterface;
use League\CommonMark\Renderer\NodeRendererInterface;
use League\CommonMark\Util\HtmlElement;
use Stringable;

final class HtmlPreviewRenderer implements NodeRendererInterface
{
    public function render(Node $node, ChildNodeRendererInterface $childRenderer): Stringable
    {
        FencedCode::assertInstanceOf($node);

        if ($node->getInfo() !== 'html-preview') {
            return (new FencedCodeRenderer())->render($node, $childRenderer);
        }

        return new HtmlElement('iframe', [
            'srcdoc' => HtmlPreviewDocument::make($node->getLiteral()),
            'sandbox' => '',
            'referrerpolicy' => 'no-referrer',
            'loading' => 'lazy',
            'title' => 'HTML / SVG',
            'style' => 'display:block;width:100%;height:480px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;',
        ], '');
    }
}
