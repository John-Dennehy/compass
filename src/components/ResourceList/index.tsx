type ResourceListProps = {
  items?: string[];
};

export function ResourceList({ items }: ResourceListProps) {
  if (!items || items.length === 0) {
    return <div>No resources found.</div>;
  }

  return (
    <ul>
      {items?.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
