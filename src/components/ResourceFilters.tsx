import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type ResourceFiltersProps = {
  audiences: string[]
  days: string[]
  currentAudience: string
  currentDay: string
  currentLocation: string
  onAudienceChange: (value: string) => void
  onDayChange: (value: string) => void
  onLocationChange: (value: string) => void
}

export function ResourceFilters({
  audiences,
  days,
  currentAudience,
  currentDay,
  currentLocation,
  onAudienceChange,
  onDayChange,
  onLocationChange,
}: ResourceFiltersProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="space-y-2">
        <Label
          htmlFor="audience-filter"
          className="text-sm font-bold tracking-tight"
          style={{ color: "var(--compass-text)" }}
        >
          Audience
        </Label>
        <Select value={currentAudience} onValueChange={onAudienceChange}>
          <SelectTrigger id="audience-filter" className="bg-white">
            <SelectValue placeholder="All Ages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ages</SelectItem>
            {audiences.map((audience) => (
              <SelectItem key={audience} value={audience}>
                {audience.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label
          htmlFor="day-filter"
          className="text-sm font-bold tracking-tight"
          style={{ color: "var(--compass-text)" }}
        >
          Day
        </Label>
        <Select value={currentDay} onValueChange={onDayChange}>
          <SelectTrigger id="day-filter" className="bg-white">
            <SelectValue placeholder="Any Day" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Day</SelectItem>
            {days.map((day) => (
              <SelectItem key={day} value={day}>
                {day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label
          htmlFor="location-filter"
          className="text-sm font-bold tracking-tight"
          style={{ color: "var(--compass-text)" }}
        >
          Location
        </Label>
        <Input
          id="location-filter"
          placeholder="e.g. Staines or TW18"
          className="bg-white"
          value={currentLocation}
          onChange={(e) => onLocationChange(e.target.value)}
        />
      </div>
    </div>
  )
}
