import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

export function App() {
  return (
    <div>
      <h1 className="text-6xl md:text-7xl font-black text-black">Compass</h1>
      <h2 className="mt-4 text-2xl md:text-3xl font-semibold text-gray-700">
        "A Community Resource Directory"
      </h2>
    </div>
  );
}
