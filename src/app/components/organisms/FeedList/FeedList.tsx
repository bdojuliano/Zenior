import FeedItem from "../../molecules/FeedItem/FeedItem";

export type FeedPost = {
  id: string;
  title: string;
  description: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: Date;
};

type FeedListProps = {
  posts: FeedPost[];
  onEditPost: (post: FeedPost) => void;
};

export default function FeedList({ posts, onEditPost }: FeedListProps) {
  return (
    <div>
      {posts.map((post) => (
        <FeedItem
          key={post.id}
          title={post.title}
          description={post.description}
          author={post.author}
          createdAt={post.createdAt}
          onEdit={() => onEditPost(post)}
        />
      ))}
    </div>
  );
}