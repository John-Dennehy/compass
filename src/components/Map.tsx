import { useState } from "react";
import { APIProvider, Map as GoogleMap, AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import type { Resource } from "@/data/resources/types";

type MapProps = {
	resources: Resource[];
};

const CustomPin = ({ category }: { category: string }) => {
	let color = "#1A1C1E"; // Default charcoal
	if (category === "playgroup") color = "#2D6AED"; // Primary blue
	if (category === "library") color = "#34A853"; // Success green

	return (
		<div style={{
			backgroundColor: color,
			width: "32px",
			height: "32px",
			borderRadius: "50% 50% 50% 0",
			transform: "rotate(-45deg)",
			border: "3px solid white",
			boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
		}}>
			<div style={{
				width: "8px",
				height: "8px",
				backgroundColor: "white",
				borderRadius: "50%",
				transform: "rotate(45deg)",
			}} />
		</div>
	);
};

function CompassMap({ resources }: MapProps) {
	const stainesCoordinates = { lat: 51.433, lng: -0.512 }; // Staines town center
	const [activeResource, setActiveResource] = useState<Resource | null>(null);

	return (
		<GoogleMap
			defaultCenter={stainesCoordinates}
			defaultZoom={12}
			mapId={import.meta.env.VITE_GOOGLE_MAPS_MAP_ID}
			style={{ height: "100%", width: "100%", borderRadius: "12px" }}
			disableDefaultUI={true}
			gestureHandling="cooperative" // Allows scrolling past the map on mobile
		>
			{resources.map((resource) => {
				if (resource.location.latitude && resource.location.longitude) {
					return (
						<AdvancedMarker
							key={resource.id}
							position={{
								lat: resource.location.latitude,
								lng: resource.location.longitude,
							}}
							onClick={() => setActiveResource(resource)}
						>
							<CustomPin category={resource.category} />
						</AdvancedMarker>
					);
				}
				return null;
			})}

			{activeResource && activeResource.location.latitude && activeResource.location.longitude && (
				<InfoWindow
					position={{
						lat: activeResource.location.latitude,
						lng: activeResource.location.longitude,
					}}
					onCloseClick={() => setActiveResource(null)}
				>
					<div className="p-1 min-w-[150px]">
						<h3 className="font-bold text-sm m-0" style={{ color: "var(--compass-text)" }}>
							{activeResource.name}
						</h3>
						<p className="text-xs mt-1 mb-0 opacity-70">
							{activeResource.location.address}
						</p>
					</div>
				</InfoWindow>
			)}
		</GoogleMap>
	);
}

export function Map({ resources }: MapProps) {
	const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
	
	if (!apiKey) {
		return (
			<div className="flex h-full w-full items-center justify-center bg-gray-100 rounded-xl text-sm font-medium text-gray-500">
				Google Maps API Key missing
			</div>
		);
	}

	return (
		<APIProvider apiKey={apiKey}>
			<CompassMap resources={resources} />
		</APIProvider>
	);
}
