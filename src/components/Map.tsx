import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { Resource } from "@/data/resources/types";

type MapProps = {
	resources: Resource[];
};

const createCustomIcon = (category: string) => {
	let color = "#1A1C1E"; // Default charcoal
	if (category === "playgroup") color = "#2D6AED"; // Primary blue
	if (category === "library") color = "#34A853"; // Success green

	return L.divIcon({
		className: "custom-marker",
		html: `<div style="
      background-color: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 8px;
        height: 8px;
        background-color: white;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>`,
		iconSize: [32, 32],
		iconAnchor: [16, 32],
		popupAnchor: [0, -32],
	});
};

export function Map({ resources }: MapProps) {
	const stainesCoordinates: [number, number] = [51.433, -0.512]; // Staines town center

	return (
		<MapContainer
			center={stainesCoordinates}
			zoom={12}
			scrollWheelZoom={false}
			style={{ height: "100%", width: "100%", borderRadius: "12px" }}
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			{resources.map((resource) => {
				if (resource.location.latitude && resource.location.longitude) {
					return (
						<Marker
							key={resource.id}
							position={[
								resource.location.latitude,
								resource.location.longitude,
							]}
							icon={createCustomIcon(resource.category)}
						>
							<Popup className="compass-popup">
								<div className="p-1">
									<h3 className="font-bold text-sm m-0" style={{ color: "var(--compass-text)" }}>
										{resource.name}
									</h3>
									<p className="text-xs mt-1 mb-0 opacity-70">
										{resource.location.address}
									</p>
								</div>
							</Popup>
						</Marker>
					);
				}
				return null;
			})}
		</MapContainer>
	);
}
