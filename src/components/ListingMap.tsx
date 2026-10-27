import { Link } from '@tanstack/react-router'
import {
	AdvancedMarker,
	APIProvider,
	Map as GoogleMap,
	InfoWindow,
	Pin,
} from '@vis.gl/react-google-maps'
import { useEffect, useState } from 'react'
import type { Point } from '@/core/distance'
import type { Listing } from '@/core/listing'

/**
 * Google Maps, because it's the map people already use on their phones. The browser key must be
 * restricted to this site's domains in Google Cloud (see the README). Everything on the map is
 * also in the list beside it, since maps are hard to use with a screen reader.
 */

const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
// Advanced markers need a map id. Google's demo id works for development.
const MAP_ID = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined) ?? 'DEMO_MAP_ID'

export const mapsEnabled = Boolean(KEY)

export function ListingMap({
	listings,
	centre,
	single = false,
	className = '',
	selected,
	onSelect,
}: {
	listings: Listing[]
	centre: Point
	single?: boolean
	className?: string
	selected?: string | null
	onSelect?: (id: string | null) => void
}) {
	// The map only draws in the browser.
	const [mounted, setMounted] = useState(false)
	const [open, setOpen] = useState<string | null>(null)
	useEffect(() => setMounted(true), [])
	const placed = listings.filter((l) => l.venue.lat !== undefined && l.venue.lng !== undefined)
	const active = selected ?? open

	if (!KEY) {
		if (single) return null
		return (
			<div className={`panel grid place-items-center p-6 text-center text-muted ${className}`}>
				<p>The map isn’t switched on here yet. Everything is in the list.</p>
			</div>
		)
	}
	if (!mounted || (single && !placed.length)) return <div className={`panel ${className}`} />

	const first = placed[0]
	const start =
		single && first ? { lat: first.venue.lat as number, lng: first.venue.lng as number } : centre
	const choose = (id: string | null) => {
		setOpen(id)
		onSelect?.(id)
	}
	const current = placed.find((l) => l.id === active)

	return (
		<>
			<div className={`overflow-hidden rounded-2xl border border-edge ${className}`}>
				<APIProvider apiKey={KEY} language="en-GB" region="GB">
					<GoogleMap
						mapId={MAP_ID}
						defaultCenter={start}
						defaultZoom={single ? 15 : 12}
						gestureHandling={single ? 'cooperative' : 'greedy'}
						disableDefaultUI={single}
						clickableIcons={false}
						style={{ width: '100%', height: '100%' }}
					>
						{placed.map((l) => (
							<AdvancedMarker
								key={l.id}
								position={{ lat: l.venue.lat as number, lng: l.venue.lng as number }}
								title={`${l.name}, ${l.venue.name}`}
								onClick={() => !single && choose(l.id)}
							>
								<Pin
									background={l.id === active ? '#f2b33d' : '#0d6662'}
									borderColor="#ffffff"
									glyphColor={l.id === active ? '#1d2a33' : '#ffffff'}
								/>
							</AdvancedMarker>
						))}
						{!single && current && (
							<InfoWindow
								position={{ lat: current.venue.lat as number, lng: current.venue.lng as number }}
								pixelOffset={[0, -36]}
								onCloseClick={() => choose(null)}
							>
								<div className="max-w-56 text-[#1d2a33]">
									<p className="font-bold">{current.name}</p>
									<p className="text-sm">{current.venue.name}</p>
									<Link
										to="/listing/$slug"
										params={{ slug: current.slug }}
										className="mt-1 inline-block font-bold text-[#0d6662] underline"
									>
										See details
									</Link>
								</div>
							</InfoWindow>
						)}
					</GoogleMap>
				</APIProvider>
			</div>
			{single && first?.venue.approximate && (
				<p className="mt-2 text-sm text-muted">
					The pin is approximate. The address above is right.
				</p>
			)}
		</>
	)
}
