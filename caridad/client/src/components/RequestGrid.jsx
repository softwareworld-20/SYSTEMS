import EmptyState from "./EmptyState.jsx";
import RequestCard from "./RequestCard.jsx";

export default function RequestGrid({
  requests,
  categoriesById,
  loading,
  hasFilters,
  onSelect,
  onClear,
  onPublish,
}) {
  if (loading && requests.length === 0) {
    return (
      <div className="grid" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="card skeleton" key={index}>
            <div className="skeleton__line skeleton__line--short" />
            <div className="skeleton__line skeleton__line--title" />
            <div className="skeleton__line" />
            <div className="skeleton__line" />
            <div className="skeleton__line skeleton__line--short" />
          </div>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        hasFilters={hasFilters}
        onClear={onClear}
        onPublish={onPublish}
      />
    );
  }

  return (
    <div className={`grid ${loading ? "grid--loading" : ""}`}>
      {requests.map((request) => (
        <RequestCard
          key={request.id}
          request={request}
          category={categoriesById.get(request.category)}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
