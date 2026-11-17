<?php

declare(strict_types=1);

namespace Nikv\Blog\Support;

use DOMDocument;
use DOMElement;

final class HtmlPreviewDocument
{
    public const CSP = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'";

    public static function make(string $source): string
    {
        $document = new DOMDocument('1.0', 'UTF-8');
        $previous = libxml_use_internal_errors(true);

        try {
            $content = trim($source) === '' ? '<html><head></head><body></body></html>' : $source;
            $document->loadHTML('<?xml encoding="UTF-8" ?>'.$content, LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING);
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }

        foreach (iterator_to_array($document->getElementsByTagName('*')) as $element) {
            $name = strtolower($element->localName);

            // Sandboxing alone does not prevent meta refresh or navigation inside the frame.
            if (in_array($name, ['meta', 'base', 'script', 'iframe', 'object', 'embed', 'link', 'animate', 'set', 'animatemotion', 'animatetransform'], true)) {
                $element->parentNode?->removeChild($element);
                continue;
            }

            if (in_array($name, ['a', 'area'], true)) {
                $element->removeAttribute('href');
                $element->removeAttribute('xlink:href');
                $element->removeAttribute('target');
            }
        }

        $head = $document->getElementsByTagName('head')->item(0);
        if (! $head instanceof DOMElement) {
            $head = $document->createElement('head');
            $document->documentElement->insertBefore($head, $document->documentElement->firstChild);
        }

        $policy = $document->createElement('meta');
        $policy->setAttribute('http-equiv', 'Content-Security-Policy');
        $policy->setAttribute('content', self::CSP);
        $head->insertBefore($policy, $head->firstChild);

        $charset = $document->createElement('meta');
        $charset->setAttribute('charset', 'UTF-8');
        $head->appendChild($charset);
        $style = $document->createElement('style');
        $style->textContent = 'html{color-scheme:light;background:#fff;color:#0f172a}body{margin:16px;overflow-wrap:anywhere}img,svg{max-width:100%;height:auto}*{box-sizing:border-box}';
        $head->appendChild($style);

        return '<!doctype html>'.$document->saveHTML($document->documentElement);
    }
}
