import { useState } from "react";
import { APIProvider, Map as GoogleMap, AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import type { Resource } from "@/data/resources/types";

type MapProps = {
	resources: Resource[];
	activeResourceId?: string | null;
	onResourceClick?: (id: string | null) => void;
};

const CustomPin = ({ category, isActive }: { category: string, isActive?: boolean }) => {
	let color = "#1A1C1E"; // Default charcoal
	if (category === "playgroup") color = "#2D6AED"; // Primary blue
	if (category === "library") color = "#34A853"; // Success green

	return (
		<div style={{
			backgroundColor: color,
			width: isActive ? "40px" : "32px",
			height: isActive ? "40px" : "32px",
			borderRadius: "50% 50% 50% 0",
			transform: "rotate(-45deg)",
			border: isActive ? "3px solid #FFD34E" : "3px solid white",
			boxShadow: isActive ? "0 10px 15px -3px rgb(0 0 0 / 0.3)" : "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			transition: "all 0.2s ease-in-out",
		}}>
			<div style={{
				width: isActive ? "12px" : "8px",
				height: isActive ? "12px" : "8px",
				backgroundColor: "white",
				borderRadius: "50%",
				transform: "rotate(45deg)",
				transition: "all 0.2s ease-in-out",
			}} />
		</div>
	);
};

function CompassMap({ resources, activeResourceId, onResourceClick }: MapProps) {
	const stainesCoordinates = { lat: 51.433, lng: -0.512 }; // Staines town center
	const activeResource = resources.find(r => r.id === activeResourceId) || null;

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
							onClick={() => onResourceClick?.(resource.id)}
							zIndex={activeResourceId === resource.id ? 1000 : undefined}
						>
							<CustomPin category={resource.category} isActive={activeResourceId === resource.id} />
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
					onCloseClick={() => onResourceClick?.(null)}
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

export function Map({ resources, activeResourceId, onResourceClick }: MapProps) {
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
			<CompassMap resources={resources} activeResourceId={activeResourceId} onResourceClick={onResourceClick} />
		</APIProvider>
	);
}
