import type { Bookmark } from '../types';
import { BookmarkCard } from './BookmarkCard';

interface BookmarkGridProps {
  bookmarks: Bookmark[];
  loading: boolean;
  error: string | null;
  pinnedIds?: string[];
  onOpen: (bookmark: Bookmark) => void;
  onTogglePin: (bookmark: Bookmark) => void;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  emptyText?: string;
}

export function BookmarkGrid({
  bookmarks,
  loading,
  error,
  pinnedIds = [],
  onOpen,
  onTogglePin,
  onEdit,
  onDelete,
  emptyText = '没找到匹配的书签，换个关键词试试。'
}: BookmarkGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-[12px] bg-white/[0.04] md:h-40 md:rounded-[14px]"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[12px] bg-rose-500/10 p-6 text-sm text-rose-100">
        {error}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="rounded-[12px] bg-white/[0.03] p-6 text-center text-sm text-[#b4b8b1] md:p-8">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
      {bookmarks.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          pinned={pinnedIds.includes(bookmark.id)}
          onOpen={onOpen}
          onTogglePin={onTogglePin}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
