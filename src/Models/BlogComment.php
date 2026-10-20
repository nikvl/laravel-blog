<?php

declare(strict_types=1);

namespace Nikv\Blog\Models;

use BeyondCode\Comments\Comment;

class BlogComment extends Comment
{
    protected $table = 'blog_comments';
}
