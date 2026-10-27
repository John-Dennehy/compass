import type { Freshness } from '@/core/freshness'
import { Icon } from './Icon'

/** A small line saying how recently someone checked. Stale listings say so plainly. */
export function FreshnessNote({
	freshness,
	compact = false,
}: {
	freshness: Freshness
	compact?: boolean
}) {
	if (freshness.warning) {
		return (
			<p className="flex items-start gap-1.5 text-sm font-bold text-coral">
				<Icon name="alert" className="mt-0.5 size-4" />
				{freshness.warning}
			</p>
		)
	}
	if (compact && freshness.level === 'recent') {
		return (
			<p className="flex items-center gap-1.5 text-sm text-muted">
				<Icon name="check" className="size-4 text-teal" />
				{freshness.short}
			</p>
		)
	}
	return (
		<p
			className={`flex items-start gap-1.5 text-sm ${freshness.level === 'recent' ? 'text-muted' : 'text-ink'}`}
		>
			<Icon
				name={freshness.level === 'recent' ? 'check' : 'clock'}
				className={`mt-0.5 size-4 ${freshness.level === 'recent' ? 'text-teal' : 'text-muted'}`}
			/>
			<span>
				{compact ? freshness.short : `${freshness.label}.`}
				{!compact && freshness.level !== 'recent' && ' Please check before you go.'}
			</span>
		</p>
	)
}
