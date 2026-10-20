<?php

return [
    'admin_prefix'     => 'admin',
    'admin_middleware' => ['auth'],

    'image_disk' => env('BLOG_IMAGE_DISK', 'public'),
    'image_path' => 'blog-covers',

    // null = feature off; required package must be installed separately
    'tags'     => null, // null | 'spatie-tags'  (spatie/laravel-tags)
    'comments' => null, // null | 'beyondcode'   (beyondcode/laravel-comments)
    'seo'      => null, // null | 'artesaos'     (artesaos/seotools)
];
