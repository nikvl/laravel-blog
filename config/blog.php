<?php

return [
    'admin_prefix'     => 'admin',
    'admin_middleware' => ['auth'],

    'image_disk' => env('BLOG_IMAGE_DISK', 'public'),
    'image_path' => 'blog-covers',

    'tags'     => null, // null | 'spatie-tags'
    'comments' => null, // null | 'beyondcode'
    'comments_require_auth' => true,  // require auth to post comment
    'comments_moderation'   => true,  // comments need approval before showing

    'seo'     => null, // null | 'artesaos'
    'seo_ssr' => false, // false = Inertia props → <Head>; true = middleware injects into <head>

    'analytics' => null, // null | 'simple'  (view counter + link click tracking)
    // NOTE: views are deduplicated by IP — configure TrustProxies in your app if running behind a reverse proxy
];
