import { AGE_GROUPS, type AgeGroup, activeFilterCount, type Filters } from '@/core/filters'
import type { Category } from '@/core/listing'

/** Who it's for, where, what kind, and free only. Native selects, so phones use their own pickers. */
export function FilterBar({
	filters,
	towns,
	categories,
	onChange,
}: {
	filters: Filters
	towns: string[]
	categories: Category[]
	onChange: (next: Filters) => void
}) {
	const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })
	const count = activeFilterCount({ ...filters, q: undefined })
	return (
		<fieldset className="flex flex-wrap items-end gap-3">
			<legend className="sr-only">Filter what’s shown</legend>
			<label className="min-w-40 flex-1">
				<span className="label text-sm">Who’s going</span>
				<select
					className="field"
					value={filters.age ?? ''}
					onChange={(e) => set({ age: (e.target.value || undefined) as AgeGroup | undefined })}
				>
					<option value="">Any age</option>
					{AGE_GROUPS.map((g) => (
						<option key={g.id} value={g.id}>
							{g.name}
						</option>
					))}
				</select>
			</label>
			<label className="min-w-36 flex-1">
				<span className="label text-sm">Where</span>
				<select
					className="field"
					value={filters.town ?? ''}
					onChange={(e) => set({ town: e.target.value || undefined })}
				>
					<option value="">Anywhere</option>
					{towns.map((t) => (
						<option key={t}>{t}</option>
					))}
				</select>
			</label>
			<label className="min-w-40 flex-1">
				<span className="label text-sm">What</span>
				<select
					className="field"
					value={filters.category ?? ''}
					onChange={(e) => set({ category: e.target.value || undefined })}
				>
					<option value="">Everything</option>
					{categories.map((c) => (
						<option key={c.slug} value={c.slug}>
							{c.name}
						</option>
					))}
				</select>
			</label>
			<label className="flex min-h-12 items-center gap-2 rounded-xl border-2 border-edge bg-surface px-3 font-bold">
				<input
					type="checkbox"
					className="size-5 accent-teal"
					checked={!!filters.free}
					onChange={(e) => set({ free: e.target.checked || undefined })}
				/>
				Free only
			</label>
			{count > 0 && (
				<button
					type="button"
					className="btn-small min-h-12"
					onClick={() => onChange({ q: filters.q })}
				>
					Clear {count === 1 ? 'filter' : `${count} filters`}
				</button>
			)}
		</fieldset>
	)
}
