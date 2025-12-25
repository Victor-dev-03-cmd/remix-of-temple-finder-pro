import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateReview, useUpdateReview, useUserReview } from '@/hooks/useTempleReviews';
import { Link } from 'react-router-dom';

interface TempleReviewFormProps {
  templeId: string;
}

const TempleReviewForm = ({ templeId }: TempleReviewFormProps) => {
  const { user } = useAuth();
  const { data: existingReview, isLoading: loadingExisting } = useUserReview(templeId);
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setTitle(existingReview.title || '');
      setComment(existingReview.comment || '');
    }
  }, [existingReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) return;

    if (existingReview) {
      updateReview.mutate({
        id: existingReview.id,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined,
      });
    } else {
      createReview.mutate({
        temple_id: templeId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined,
      });
    }
  };

  if (!user) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <h3 className="mb-2 font-semibold text-foreground">Share Your Experience</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Sign in to write a review and share your temple experience with the community.
        </p>
        <Link to="/auth">
          <Button>Sign In to Review</Button>
        </Link>
      </div>
    );
  }

  if (loadingExisting) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="h-32 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const isSubmitting = createReview.isPending || updateReview.isPending;

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-6">
      <h3 className="mb-4 font-semibold text-foreground">
        {existingReview ? 'Update Your Review' : 'Write a Review'}
      </h3>

      {/* Rating */}
      <div className="mb-4">
        <Label className="mb-2 block">Your Rating *</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`h-7 w-7 ${
                  star <= (hoverRating || rating)
                    ? 'fill-temple-gold text-temple-gold'
                    : 'fill-muted text-muted-foreground'
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <Label htmlFor="title" className="mb-2 block">
          Review Title (Optional)
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={100}
        />
      </div>

      {/* Comment */}
      <div className="mb-4">
        <Label htmlFor="comment" className="mb-2 block">
          Your Review (Optional)
        </Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell others about your experience at this temple..."
          rows={4}
          maxLength={1000}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {comment.length}/1000 characters
        </p>
      </div>

      <Button type="submit" disabled={rating === 0 || isSubmitting}>
        {isSubmitting
          ? 'Submitting...'
          : existingReview
          ? 'Update Review'
          : 'Submit Review'}
      </Button>
    </form>
  );
};

export default TempleReviewForm;
