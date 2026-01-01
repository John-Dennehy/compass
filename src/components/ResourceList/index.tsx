type ResourceListProps = {
  items?: string[];
};

export function ResourceList({ items }: ResourceListProps) {
  if (!items) {
    items = [];
  }

  if (items.length === 0) {
    return <p>No resources found</p>;
  }

  return (
    <ul>
      {items?.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
