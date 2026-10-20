<?php

declare(strict_types=1);

namespace Nikv\Blog\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BlogSeoMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (config('blog.seo') !== 'artesaos' || ! config('blog.seo_ssr')) {
            return $response;
        }

        $content = $response->getContent();

        if (! $content || ! str_contains($content, '</head>')) {
            return $response;
        }

        $seoTags = app('seotools')->generate(true);
        $response->setContent(str_replace('</head>', $seoTags.'</head>', $content));

        return $response;
    }
}
