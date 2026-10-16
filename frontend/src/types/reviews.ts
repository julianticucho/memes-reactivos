export interface Review {
  _id: string;
  text: string | null;
  vote: 1 | -1;
  reviewedUser: string;
  user: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  upvotes: number;
  downvotes: number;
  score: number;
  count: number;
}

export interface ReviewsResponse {
  reviews: Review[];
  stats: ReviewStats;
}

export interface ReviewData {
  text?: string | null;
  vote: 1 | -1;
}
