<?php

declare(strict_types=1);

namespace Nikv\Blog\Models;

use Spatie\Tags\Tag;

class BlogTag extends Tag
{
    protected $table = 'blog_tags';
}
