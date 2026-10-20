<?php

declare(strict_types=1);

namespace Nikv\Blog\Models;

use BeyondCode\Comments\Traits\HasComments;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Spatie\Tags\HasTags;

/**
 * @property int $id
 * @property string $slug
 * @property string $title
 * @property string|null $excerpt
 * @property string $body
 * @property string|null $markdown
 * @property string|null $author
 * @property string|null $cover_image
 * @property Carbon|null $published_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class BlogPost extends Model
{
    use HasComments, HasTags;

    protected $fillable = [
        'slug', 'title', 'excerpt', 'body', 'markdown',
        'author', 'cover_image', 'published_at',
    ];

    protected function casts(): array
    {
        return ['published_at' => 'datetime'];
    }

    /** @param Builder<BlogPost> $query */
    public function scopePublished(Builder $query): void
    {
        $query->whereNotNull('published_at')->where('published_at', '<=', now());
    }
}
