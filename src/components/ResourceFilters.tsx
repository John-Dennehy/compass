import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type ResourceFiltersProps = {
  audiences: string[]
  days: string[]
  categories: string[]
  currentAudience: string[]
  currentDay: string[]
  currentLocation: string
  currentCategory: string
  currentCost: string
  onAudienceChange: (value: string) => void
  onDayChange: (value: string) => void
  onLocationChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onCostChange: (value: string) => void
}

export function ResourceFilters({
  audiences,
  days,
  categories,
  currentAudience,
  currentDay,
  currentLocation,
  currentCategory,
  currentCost,
  onAudienceChange,
  onDayChange,
  onLocationChange,
  onCategoryChange,
  onCostChange,
}: ResourceFiltersProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-3">
        <Label
          className="text-sm font-bold tracking-tight"
          style={{ color: "var(--compass-text)" }}
        >
          Category
        </Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={currentCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
            onClick={() => onCategoryChange('all')}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              type="button"
              variant={currentCategory === category ? 'default' : 'outline'}
              size="sm"
              className="rounded-full"
              onClick={() => onCategoryChange(category)}
            >
              {category.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label
          className="text-sm font-bold tracking-tight"
          style={{ color: "var(--compass-text)" }}
        >
          Audience
        </Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={currentAudience.length === 0 ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
            onClick={() => onAudienceChange('all')}
          >
            All Ages
          </Button>
          {audiences.map((audience) => (
            <Button
              key={audience}
              type="button"
              variant={currentAudience.includes(audience) ? 'default' : 'outline'}
              size="sm"
              className="rounded-full"
              onClick={() => onAudienceChange(audience)}
            >
              {audience.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label
          className="text-sm font-bold tracking-tight"
          style={{ color: "var(--compass-text)" }}
        >
          Day
        </Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={currentDay.length === 0 ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
            onClick={() => onDayChange('all')}
          >
            Any Day
          </Button>
          {days.map((day) => (
            <Button
              key={day}
              type="button"
              variant={currentDay.includes(day) ? 'default' : 'outline'}
              size="sm"
              className="rounded-full"
              onClick={() => onDayChange(day)}
            >
              {day}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label
          className="text-sm font-bold tracking-tight"
          style={{ color: "var(--compass-text)" }}
        >
          Cost
        </Label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'Any Cost' },
            { value: 'free', label: 'Free' },
            { value: 'donation', label: 'Donation' },
            { value: 'fixed-price', label: 'Fixed Price' },
          ].map((costOption) => (
            <Button
              key={costOption.value}
              type="button"
              variant={currentCost === costOption.value ? 'default' : 'outline'}
              size="sm"
              className="rounded-full"
              onClick={() => onCostChange(costOption.value)}
            >
              {costOption.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
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

