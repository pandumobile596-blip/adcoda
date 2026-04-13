import { SwipeCard } from "./SwipeCard";

export const MasonryGrid = ({ swipes, onView, onDelete }) => {
  return (
    <div className="masonry-grid">
      {swipes.map((swipe, index) => (
        <SwipeCard
          key={swipe.id}
          swipe={swipe}
          index={index}
          onView={onView}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
