import { useEffect, useState } from 'react'
import type { Resource } from '@/data/resources/types'

// Define the props for the actual Map component
type MapProps = {
  resources: Resource[]
}

// A placeholder or loading component
const MapLoading = () => (
  <div
    className="flex h-full items-center justify-center text-sm font-medium"
    style={{ backgroundColor: 'var(--compass-surface)', color: 'var(--compass-text)' }}
  >
    Loading map…
  </div>
)

export function DynamicMap(props: MapProps) {
  const [MapComponent, setMapComponent] =
    useState<React.ComponentType<MapProps> | null>(null)

  useEffect(() => {
    // This effect runs only on the client
    import('@/components/Map').then((module) => {
      setMapComponent(() => module.Map)
    })
  }, [])

  if (MapComponent) {
    return <MapComponent {...props} />
  }

  return <MapLoading />
}
