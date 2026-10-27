import { cloneElement, type ReactElement, type ReactNode, useId, useState } from 'react'
import { dayName } from '@/core/dates'
import { type Category, DAYS, type Day, type DetailsInput, detailsSchema } from '@/core/listing'
import { AGE_OPTIONS, type Draft, emptySession, toDetails } from '@/lib/draft'
import { Icon } from './Icon'

/**
 * The one form for adding a listing and for changing one. It asks in plain words, works with
 * phone keyboards (time and date pickers), and checks everything with the same rules as the
 * server before sending.
 */

export function ListingForm({
	initial,
	towns,
	categories,
	submitLabel,
	extra,
	onSubmit,
}: {
	initial: Draft
	towns: string[]
	categories: Category[]
	submitLabel: string
	/** Fields that only one form needs, like a message to the moderators. */
	extra?: ReactNode
	onSubmit: (details: DetailsInput, form: FormData) => Promise<string | null>
}) {
	const [draft, setDraft] = useState(initial)
	const [error, setError] = useState<string | null>(null)
	const [busy, setBusy] = useState(false)
	const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
		setDraft((d) => ({ ...d, [key]: value }))
	const id = useId()

	async function submit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		const details = toDetails(draft)
		const checked = detailsSchema.safeParse(details)
		if (!checked.success) {
			const issue = checked.error.issues[0]
			setError(
				`${describePath(issue?.path ?? [])}${issue?.message ?? 'Something isn’t filled in right.'}`,
			)
			return
		}
		setBusy(true)
		setError(null)
		try {
			setError(await onSubmit(details, new FormData(e.currentTarget)))
		} catch {
			setError('That didn’t send. Please try again.')
		} finally {
			setBusy(false)
		}
	}

	return (
		<form onSubmit={submit} className="grid gap-8" noValidate>
			<Section title="What is it?">
				<fieldset>
					<legend className="label">How often</legend>
					<div className="flex flex-wrap gap-2">
						{(
							[
								['regular', 'It happens regularly'],
								['one-off', 'It’s a one-off event'],
							] as const
						).map(([value, label]) => (
							<label
								key={value}
								className="flex min-h-12 items-center gap-2 rounded-xl border-2 border-edge bg-surface px-4 font-bold has-checked:border-teal has-checked:bg-teal-soft"
							>
								<input
									type="radio"
									name={`${id}-kind`}
									className="size-5 accent-teal"
									checked={draft.kind === value}
									onChange={() => set('kind', value)}
								/>
								{label}
							</label>
						))}
					</div>
				</fieldset>
				<Field label="Name" hint="What people call it, like “Butterflies Toddler Group”.">
					<input
						className="field"
						required
						maxLength={120}
						value={draft.name}
						onChange={(e) => set('name', e.target.value)}
					/>
				</Field>
				<Field label="Kind of thing">
					<select
						className="field"
						required
						value={draft.category}
						onChange={(e) => set('category', e.target.value)}
					>
						<option value="">Choose one</option>
						{categories.map((c) => (
							<option key={c.slug} value={c.slug}>
								{c.name}
							</option>
						))}
					</select>
				</Field>
				<Field
					label="A short description"
					hint="Optional. What happens there, in a sentence or two."
				>
					<textarea
						className="field min-h-24"
						maxLength={400}
						value={draft.summary}
						onChange={(e) => set('summary', e.target.value)}
					/>
				</Field>
			</Section>

			<Section title="Who’s it for?">
				<Field
					label="In your own words"
					hint="Like “0 to 4 years” or “Pre-schoolers and their carers”."
				>
					<input
						className="field"
						required
						maxLength={120}
						value={draft.whoFor}
						onChange={(e) => set('whoFor', e.target.value)}
					/>
				</Field>
				<Check checked={draft.allAges} onChange={(v) => set('allAges', v)}>
					Any age, including grown-ups
				</Check>
				{!draft.allAges && (
					<div className="grid grid-cols-2 gap-3">
						<Field label="Ages from">
							<select
								className="field"
								value={draft.from}
								onChange={(e) => set('from', e.target.value)}
							>
								{AGE_OPTIONS.map((a) => (
									<option key={a.months} value={a.months}>
										{a.label}
									</option>
								))}
							</select>
						</Field>
						<Field label="To under">
							<select
								className="field"
								value={draft.to}
								onChange={(e) => set('to', e.target.value)}
							>
								{AGE_OPTIONS.slice(1).map((a) => (
									<option key={a.months} value={a.months}>
										{a.label}
									</option>
								))}
							</select>
						</Field>
					</div>
				)}
				<Check checked={draft.expecting} onChange={(v) => set('expecting', v)}>
					Expectant parents are welcome
				</Check>
			</Section>

			<Section title="Where?">
				<Field label="Name of the place" hint="Like “Stanwell Village Hall”.">
					<input
						className="field"
						required
						maxLength={120}
						value={draft.venueName}
						onChange={(e) => set('venueName', e.target.value)}
					/>
				</Field>
				<Field label="Address">
					<input
						className="field"
						required
						maxLength={200}
						autoComplete="street-address"
						value={draft.address}
						onChange={(e) => set('address', e.target.value)}
					/>
				</Field>
				<div className="grid grid-cols-2 gap-3">
					<Field label="Postcode" hint="For the map.">
						<input
							className="field uppercase"
							maxLength={8}
							autoComplete="postal-code"
							value={draft.postcode}
							onChange={(e) => set('postcode', e.target.value)}
						/>
					</Field>
					<Field label="Town">
						<select
							className="field"
							required
							value={draft.town}
							onChange={(e) => set('town', e.target.value)}
						>
							<option value="">Choose one</option>
							{towns.map((t) => (
								<option key={t}>{t}</option>
							))}
						</select>
					</Field>
				</div>
			</Section>

			<Section title="When?">
				{draft.kind === 'regular' ? (
					<>
						{draft.sessions.map((s, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: rows have no identity of their own, and every input in them is controlled
							<fieldset key={i} className="grid gap-3 rounded-2xl border-2 border-edge p-4">
								<legend className="px-1 font-bold">
									Session {draft.sessions.length > 1 ? i + 1 : ''}
								</legend>
								<div className="grid grid-cols-3 gap-3">
									<Field label="Day">
										<select
											className="field"
											value={s.day}
											onChange={(e) => updateSession(setDraft, i, { day: e.target.value as Day })}
										>
											{DAYS.map((d) => (
												<option key={d} value={d}>
													{dayName(d)}
												</option>
											))}
										</select>
									</Field>
									<Field label="Starts">
										<input
											type="time"
											className="field"
											required
											value={s.start}
											onChange={(e) => updateSession(setDraft, i, { start: e.target.value })}
										/>
									</Field>
									<Field label="Ends">
										<input
											type="time"
											className="field"
											value={s.end}
											onChange={(e) => updateSession(setDraft, i, { end: e.target.value })}
										/>
									</Field>
								</div>
								<div className="grid gap-3 sm:grid-cols-2">
									<Field label="How often">
										<select
											className="field"
											value={s.every}
											onChange={(e) =>
												updateSession(setDraft, i, { every: e.target.value as typeof s.every })
											}
										>
											<option value="week">Every week</option>
											<option value="fortnight">Every other week</option>
											<option value="month">Once a month</option>
										</select>
									</Field>
									{s.every === 'fortnight' && (
										<Field label="A date it was on" hint="So we know which weeks.">
											<input
												type="date"
												className="field"
												required
												value={s.from}
												onChange={(e) => updateSession(setDraft, i, { from: e.target.value })}
											/>
										</Field>
									)}
									{s.every === 'month' && (
										<Field label="Which week">
											<select
												className="field"
												value={s.week}
												onChange={(e) =>
													updateSession(setDraft, i, { week: e.target.value as typeof s.week })
												}
											>
												<option value="1">The first</option>
												<option value="2">The second</option>
												<option value="3">The third</option>
												<option value="4">The fourth</option>
												<option value="last">The last</option>
											</select>
										</Field>
									)}
								</div>
								<Field label="Label" hint="Optional, for groups that split, like “Babies”.">
									<input
										className="field"
										maxLength={60}
										value={s.label}
										onChange={(e) => updateSession(setDraft, i, { label: e.target.value })}
									/>
								</Field>
								<Check
									checked={s.termTimeOnly}
									onChange={(v) => updateSession(setDraft, i, { termTimeOnly: v })}
								>
									Term time only (not in the school holidays)
								</Check>
								{draft.sessions.length > 1 && (
									<button
										type="button"
										className="btn-small justify-self-start"
										onClick={() =>
											setDraft((d) => ({ ...d, sessions: d.sessions.filter((_, j) => j !== i) }))
										}
									>
										Remove this session
									</button>
								)}
							</fieldset>
						))}
						<button
							type="button"
							className="btn-quiet justify-self-start"
							onClick={() =>
								setDraft((d) => {
									const last = d.sessions.at(-1)
									const next = DAYS[(DAYS.indexOf(last?.day ?? 'sunday') + 1) % 7] as Day
									return {
										...d,
										sessions: [...d.sessions, { ...(last ?? emptySession()), day: next }],
									}
								})
							}
						>
							<Icon name="plus" />
							Add another day or time
						</button>
					</>
				) : (
					<>
						{draft.dates.map((o, i) => (
							<fieldset
								// biome-ignore lint/suspicious/noArrayIndexKey: rows have no identity of their own, and every input in them is controlled
								key={i}
								className="grid grid-cols-3 gap-3 rounded-2xl border-2 border-edge p-4"
							>
								<legend className="px-1 font-bold">
									Date {draft.dates.length > 1 ? i + 1 : ''}
								</legend>
								<Field label="Date">
									<input
										type="date"
										className="field"
										required
										value={o.date}
										onChange={(e) => updateDate(setDraft, i, { date: e.target.value })}
									/>
								</Field>
								<Field label="Starts">
									<input
										type="time"
										className="field"
										value={o.start}
										onChange={(e) => updateDate(setDraft, i, { start: e.target.value })}
									/>
								</Field>
								<Field label="Ends">
									<input
										type="time"
										className="field"
										value={o.end}
										onChange={(e) => updateDate(setDraft, i, { end: e.target.value })}
									/>
								</Field>
								{draft.dates.length > 1 && (
									<button
										type="button"
										className="btn-small col-span-3 justify-self-start"
										onClick={() =>
											setDraft((d) => ({ ...d, dates: d.dates.filter((_, j) => j !== i) }))
										}
									>
										Remove this date
									</button>
								)}
							</fieldset>
						))}
						<button
							type="button"
							className="btn-quiet justify-self-start"
							onClick={() =>
								setDraft((d) => ({
									...d,
									dates: [
										...d.dates,
										{
											date: '',
											start: d.dates.at(-1)?.start ?? '',
											end: d.dates.at(-1)?.end ?? '',
										},
									],
								}))
							}
						>
							<Icon name="plus" />
							Add another date
						</button>
					</>
				)}
			</Section>

			<Section title="Cost and contact">
				<div className="grid gap-3 sm:grid-cols-2">
					<Field label="Cost">
						<select
							className="field"
							value={draft.costKind}
							onChange={(e) => set('costKind', e.target.value as Draft['costKind'])}
						>
							<option value="unknown">Not sure</option>
							<option value="free">Free</option>
							<option value="donation">Donation</option>
							<option value="paid">Paid</option>
						</select>
					</Field>
					<Field label="Cost details" hint="Optional, like “£2 per family”.">
						<input
							className="field"
							maxLength={120}
							value={draft.costNote}
							onChange={(e) => set('costNote', e.target.value)}
						/>
					</Field>
				</div>
				{draft.contacts.map((c, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: rows have no identity of their own, and every input in them is controlled
					<div key={i} className="grid gap-3 sm:grid-cols-[8rem_1fr_1fr_auto] sm:items-end">
						<Field label="Contact by">
							<select
								className="field"
								value={c.kind}
								onChange={(e) =>
									updateList(setDraft, 'contacts', i, { kind: e.target.value as typeof c.kind })
								}
							>
								<option value="phone">Phone</option>
								<option value="text">Text</option>
								<option value="email">Email</option>
							</select>
						</Field>
						<Field label={c.kind === 'email' ? 'Email address' : 'Number'}>
							<input
								className="field"
								maxLength={120}
								value={c.value}
								onChange={(e) => updateList(setDraft, 'contacts', i, { value: e.target.value })}
							/>
						</Field>
						<Field label="Who to ask for" hint="Optional.">
							<input
								className="field"
								maxLength={60}
								value={c.name}
								onChange={(e) => updateList(setDraft, 'contacts', i, { name: e.target.value })}
							/>
						</Field>
						<button
							type="button"
							className="btn-small min-h-12"
							onClick={() =>
								setDraft((d) => ({ ...d, contacts: d.contacts.filter((_, j) => j !== i) }))
							}
						>
							Remove
						</button>
					</div>
				))}
				{draft.links.map((l, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: rows have no identity of their own, and every input in them is controlled
					<div key={i} className="grid gap-3 sm:grid-cols-[8rem_1fr_auto] sm:items-end">
						<Field label="Link to">
							<select
								className="field"
								value={l.kind}
								onChange={(e) =>
									updateList(setDraft, 'links', i, { kind: e.target.value as typeof l.kind })
								}
							>
								<option value="website">Website</option>
								<option value="facebook">Facebook</option>
								<option value="instagram">Instagram</option>
								<option value="other">Other</option>
							</select>
						</Field>
						<Field label="Web address">
							<input
								type="url"
								inputMode="url"
								className="field"
								maxLength={300}
								value={l.url}
								onChange={(e) => updateList(setDraft, 'links', i, { url: e.target.value })}
							/>
						</Field>
						<button
							type="button"
							className="btn-small min-h-12"
							onClick={() => setDraft((d) => ({ ...d, links: d.links.filter((_, j) => j !== i) }))}
						>
							Remove
						</button>
					</div>
				))}
				<div className="flex flex-wrap gap-2">
					{draft.contacts.length < 3 && (
						<button
							type="button"
							className="btn-quiet"
							onClick={() =>
								setDraft((d) => ({
									...d,
									contacts: [...d.contacts, { kind: 'phone', value: '', name: '' }],
								}))
							}
						>
							<Icon name="plus" />
							Phone or email
						</button>
					)}
					{draft.links.length < 3 && (
						<button
							type="button"
							className="btn-quiet"
							onClick={() =>
								setDraft((d) => ({ ...d, links: [...d.links, { kind: 'website', url: '' }] }))
							}
						>
							<Icon name="plus" />
							Website or page
						</button>
					)}
				</div>
				<Field
					label="Anything else people should know"
					hint="Optional, like “No need to book” or “Free parking behind the hall”."
				>
					<textarea
						className="field min-h-24"
						maxLength={500}
						value={draft.notes}
						onChange={(e) => set('notes', e.target.value)}
					/>
				</Field>
			</Section>

			{extra}

			{/* Hidden from people; bots fill it in. */}
			<div aria-hidden className="absolute -left-[9999px]">
				<label>
					Leave this empty
					<input name="website" tabIndex={-1} autoComplete="off" />
				</label>
			</div>

			<div className="sticky bottom-20 z-20 grid gap-3 rounded-2xl border border-edge bg-surface p-4 shadow-lg md:bottom-4">
				{error && (
					<p role="alert" className="font-bold text-coral">
						{error}
					</p>
				)}
				<button type="submit" className="btn-primary" disabled={busy}>
					{busy ? 'Sending…' : submitLabel}
				</button>
			</div>
		</form>
	)
}

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="grid gap-4">
			<h2 className="text-2xl font-extrabold">{title}</h2>
			{children}
		</section>
	)
}

function Field({
	label,
	hint,
	children,
}: {
	label: string
	hint?: string
	children: ReactElement<{ id?: string; 'aria-describedby'?: string }>
}) {
	const id = useId()
	return (
		<div>
			<label htmlFor={id} className="label">
				{label}
			</label>
			{hint && (
				<p id={`${id}-hint`} className="hint mb-1">
					{hint}
				</p>
			)}
			{cloneElement(children, { id, 'aria-describedby': hint ? `${id}-hint` : undefined })}
		</div>
	)
}

function Check({
	checked,
	onChange,
	children,
}: {
	checked: boolean
	onChange: (v: boolean) => void
	children: ReactNode
}) {
	return (
		<label className="flex min-h-12 items-center gap-3 font-bold">
			<input
				type="checkbox"
				className="size-6 accent-teal"
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
			/>
			{children}
		</label>
	)
}

type SetDraft = React.Dispatch<React.SetStateAction<Draft>>

function updateSession(
	setDraft: SetDraft,
	index: number,
	patch: Partial<Draft['sessions'][number]>,
) {
	setDraft((d) => ({
		...d,
		sessions: d.sessions.map((s, i) => (i === index ? { ...s, ...patch } : s)),
	}))
}

function updateDate(setDraft: SetDraft, index: number, patch: Partial<Draft['dates'][number]>) {
	setDraft((d) => ({ ...d, dates: d.dates.map((s, i) => (i === index ? { ...s, ...patch } : s)) }))
}

function updateList<K extends 'contacts' | 'links'>(
	setDraft: SetDraft,
	key: K,
	index: number,
	patch: Partial<Draft[K][number]>,
) {
	setDraft((d) => ({
		...d,
		[key]: (d[key] as Draft[K][number][]).map((x, i) => (i === index ? { ...x, ...patch } : x)),
	}))
}

const PATH_NAMES: Record<string, string> = {
	name: 'Name',
	category: 'Kind of thing',
	whoFor: 'Who it’s for',
	ages: 'Ages',
	venue: 'Place',
	when: 'When',
	sessions: 'When',
	dates: 'When',
	contacts: 'Contact',
	links: 'Link',
	address: 'Address',
	postcode: 'Postcode',
	town: 'Town',
	start: 'Start time',
	end: 'End time',
	date: 'Date',
	url: 'Web address',
	from: 'Date it was on',
}

/** "Postcode: " for an error on venue.postcode, so people know where to look. */
function describePath(path: PropertyKey[]): string {
	const named = [...path].reverse().find((p) => typeof p === 'string' && PATH_NAMES[p])
	return typeof named === 'string' ? `${PATH_NAMES[named]}: ` : ''
}
