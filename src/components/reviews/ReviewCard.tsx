import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Review } from '@/lib/data';

interface ReviewCardProps {
  review: Review;
  index?: number;
}

const ReviewCard = ({ review, index = 0 }: ReviewCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="rounded-lg border border-border bg-card p-4"
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <img
            src={review.userAvatar}
            alt={review.userName}
            className="h-10 w-10 rounded-full bg-muted"
          />
          <div>
            <h4 className="font-medium text-foreground">{review.userName}</h4>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < review.rating
                      ? 'fill-temple-gold text-temple-gold'
                      : 'fill-muted text-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(review.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Content */}
      <p className="text-sm text-muted-foreground">{review.comment}</p>
    </motion.div>
  );
};

export default ReviewCard;
