import type { Area, Category, Day, DetailsInput } from '@/core/listing'

/**
 * The launch data: Spelthorne's playgroups leaflet from September 2025 (kept as it came in
 * `sources/`), turned into listings. Map positions are rough until they're looked up from the
 * postcode, and every listing starts out "last checked September 2025" so the first visitors
 * can confirm or correct it.
 */

export const SOURCE_DATE = '2025-09-01T00:00:00.000Z'

export const spelthorne: Area = {
	id: 'spelthorne',
	name: 'Spelthorne',
	region: 'Surrey',
	towns: ['Ashford', 'Laleham', 'Shepperton', 'Staines', 'Stanwell', 'Sunbury'],
	centre: { lat: 51.428, lng: -0.47 },
	termSource: {
		name: 'Surrey County Council term dates',
		url: 'https://www.surreycc.gov.uk/schools-and-learning/schools/term-dates',
	},
	terms: [
		{
			name: 'Autumn 2025',
			start: '2025-09-03',
			end: '2025-12-19',
			halfTerm: { start: '2025-10-27', end: '2025-10-31' },
		},
		{
			name: 'Spring 2026',
			start: '2026-01-05',
			end: '2026-03-27',
			halfTerm: { start: '2026-02-16', end: '2026-02-20' },
		},
		{
			name: 'Summer 2026',
			start: '2026-04-13',
			end: '2026-07-22',
			halfTerm: { start: '2026-05-25', end: '2026-05-29' },
		},
		{
			name: 'Autumn 2026',
			start: '2026-09-01',
			end: '2026-12-18',
			halfTerm: { start: '2026-10-19', end: '2026-10-30' },
		},
		{
			name: 'Spring 2027',
			start: '2027-01-04',
			end: '2027-03-25',
			halfTerm: { start: '2027-02-15', end: '2027-02-19' },
		},
		{
			name: 'Summer 2027',
			start: '2027-04-12',
			end: '2027-07-28',
			halfTerm: { start: '2027-05-31', end: '2027-06-04' },
		},
	],
}

export const categories: Category[] = [
	{
		slug: 'stay-and-play',
		name: 'Stay and play',
		description: 'Toddler groups and playgroups where you stay with your child.',
	},
	{
		slug: 'baby-group',
		name: 'Bumps and babies',
		description: 'Groups for expectant parents and new babies.',
	},
	{
		slug: 'stories-and-rhymes',
		name: 'Stories and rhymes',
		description: 'Rhymetime and storytime, mostly at libraries.',
	},
	{
		slug: 'classes',
		name: 'Classes and activities',
		description: 'Music, movement, swimming and other led sessions.',
	},
	{
		slug: 'support',
		name: 'Support and advice',
		description: 'Health visitors, feeding support, food banks and advice for parents and carers.',
	},
	{
		slug: 'family-events',
		name: 'Family events',
		description: 'Fairs, festivals, open days and other one-off events.',
	},
]

type Seed = Omit<DetailsInput, 'venue'> & { venue: keyof typeof venues }

const venues = {
	congregational: {
		name: 'Staines Congregational Church Hall',
		address: 'Stainash Crescent, Staines',
		postcode: 'TW18 1AY',
		town: 'Staines',
		lat: 51.437,
		lng: -0.501,
	},
	salvationArmy: {
		name: 'Salvation Army',
		address: 'Woodthorpe Road, Ashford',
		postcode: 'TW15 3JY',
		town: 'Ashford',
		lat: 51.437,
		lng: -0.473,
	},
	stanwellHall: {
		name: 'Stanwell Village Hall',
		address: 'High Street, Stanwell',
		postcode: 'TW19 7JR',
		town: 'Stanwell',
		lat: 51.442,
		lng: -0.505,
	},
	ashfordBaptist: {
		name: 'Ashford Baptist Church',
		address: 'Church Road, Ashford',
		postcode: 'TW15 2TT',
		town: 'Ashford',
		lat: 51.433,
		lng: -0.477,
	},
	openDoor: {
		name: 'Open Door Church',
		address: 'Corner of Green Street and Rooksmead Road, Lower Sunbury',
		postcode: 'TW16 6QQ',
		town: 'Sunbury',
		lat: 51.413,
		lng: -0.424,
	},
	stanwellMoor: {
		name: 'Stanwell Moor Village Hall',
		address: 'Horton Road, Stanwell Moor',
		postcode: 'TW19 6AQ',
		town: 'Stanwell',
		lat: 51.459,
		lng: -0.508,
	},
	rosary: {
		name: 'Our Lady of the Rosary Church',
		address: '59 Gresham Road, Staines',
		postcode: 'TW18 2BD',
		town: 'Staines',
		lat: 51.432,
		lng: -0.518,
	},
	stPeters: {
		name: 'St Peter’s Church Hall',
		address: 'Laleham Road, Staines',
		postcode: 'TW18 2DX',
		town: 'Staines',
		lat: 51.428,
		lng: -0.52,
	},
	stainesBaptist: {
		name: 'Staines Baptist Church',
		address: '16 Hale Street, Staines',
		postcode: 'TW18 4UW',
		town: 'Staines',
		lat: 51.434,
		lng: -0.512,
	},
	oldSchool: {
		name: 'The Old School Building',
		address: 'New Road, Littleton, Shepperton',
		postcode: 'TW17 0QQ',
		town: 'Shepperton',
		lat: 51.403,
		lng: -0.468,
	},
	stSaviours: {
		name: 'St Saviour’s Church',
		address: 'Vicarage Road, Sunbury-on-Thames',
		postcode: 'TW16 7TP',
		town: 'Sunbury',
		lat: 51.417,
		lng: -0.42,
	},
	sheppertonHall: {
		name: 'Shepperton Village Hall',
		address: 'High Street, Shepperton',
		postcode: 'TW17 9AU',
		town: 'Shepperton',
		lat: 51.389,
		lng: -0.449,
	},
	sunburyMethodist: {
		name: 'Sunbury Methodist Church',
		address: 'Staines Road East, Sunbury-on-Thames',
		postcode: 'TW16 5AD',
		town: 'Sunbury',
		lat: 51.416,
		lng: -0.413,
	},
	lalehamYouth: {
		name: 'The Youth Centre',
		address: 'The Broadway, Laleham',
		postcode: 'TW18 1RZ',
		town: 'Laleham',
		lat: 51.418,
		lng: -0.49,
	},
	stainesPrep: {
		name: 'Staines Preparatory School and Nursery',
		address: '3–5 Gresham Road, Staines',
		postcode: 'TW18 2BT',
		town: 'Staines',
		lat: 51.432,
		lng: -0.518,
	},
	stainesMethodist: {
		name: 'Staines Methodist Church',
		address: 'Thames Street, Staines',
		postcode: 'TW18 4SD',
		town: 'Staines',
		lat: 51.433,
		lng: -0.513,
	},
	stainesLibrary: {
		name: 'Staines Library',
		address: 'Friends Walk, Staines-upon-Thames',
		postcode: 'TW18 4PG',
		town: 'Staines',
		lat: 51.433,
		lng: -0.512,
	},
	ashfordLibrary: {
		name: 'Ashford Library',
		address: 'Church Road, Ashford',
		postcode: 'TW15 2XB',
		town: 'Ashford',
		lat: 51.432,
		lng: -0.47,
	},
	sheppertonLibrary: {
		name: 'Shepperton Library',
		address: 'High Street, Shepperton',
		postcode: 'TW17 9AU',
		town: 'Shepperton',
		lat: 51.393,
		lng: -0.45,
	},
	stanwellLibrary: {
		name: 'Stanwell Library',
		address: 'Hadrian Way, Stanwell',
		postcode: 'TW19 7HE',
		town: 'Stanwell',
		lat: 51.443,
		lng: -0.505,
	},
	sunburyLibrary: {
		name: 'Sunbury Library',
		address: 'The Parade, Sunbury-on-Thames',
		postcode: 'TW16 7AB',
		town: 'Sunbury',
		lat: 51.419,
		lng: -0.412,
	},
} as const

const weekly = (
	days: Day[],
	start: string,
	end?: string,
	termTimeOnly = false,
): DetailsInput['when'] => ({
	kind: 'regular',
	sessions: days.map((day) => ({ day, start, end, termTimeOnly })),
})

const under = (years: number) => ({ from: 0, to: years * 12 })
const preschool = { from: 24, to: 60 }
const facebook = (url: string) => [{ kind: 'facebook' as const, url }]
const website = (url: string) => [{ kind: 'website' as const, url }]
const rhymetime = {
	name: 'Rhymetime',
	category: 'stories-and-rhymes',
	summary: 'Songs and rhymes for little ones at the library.',
	whoFor: '0 to 5 years',
	ages: under(6),
}

export const seeds: Seed[] = [
	{
		name: 'NCT Bumps & Babes',
		category: 'baby-group',
		whoFor: 'Expectant parents and under 1s',
		ages: under(1),
		expecting: true,
		venue: 'congregational',
		when: weekly(['monday'], '10:30', '11:45'),
		links: facebook('https://www.facebook.com/NCTSAE'),
	},
	{
		name: 'Butterflies Toddler Group',
		category: 'stay-and-play',
		whoFor: '0 to 4 years',
		ages: under(5),
		venue: 'salvationArmy',
		when: weekly(['monday', 'wednesday', 'thursday'], '10:00', '12:00'),
		links: facebook('https://www.facebook.com/groups/butterfliestoddlersgroup'),
	},
	{
		name: 'Little Owls Playgroup',
		category: 'stay-and-play',
		whoFor: 'Pre-schoolers',
		ages: preschool,
		venue: 'stanwellHall',
		when: weekly(['monday'], '09:30', '11:30'),
		links: facebook('https://www.facebook.com/stanwellevents'),
	},
	{
		...rhymetime,
		venue: 'stainesLibrary',
		when: weekly(['monday', 'wednesday', 'friday', 'saturday'], '10:30', '11:00'),
	},
	{
		name: 'Buggies and Bikes Toddler Group',
		category: 'stay-and-play',
		whoFor: '0 to 4 years',
		ages: under(5),
		venue: 'congregational',
		when: weekly(['tuesday', 'thursday'], '09:30', '11:30', true),
		links: facebook('https://www.facebook.com/groups/899487290073727'),
	},
	{
		name: 'Stanwell Messy Play',
		category: 'stay-and-play',
		whoFor: 'Babies and toddlers under 5',
		ages: under(5),
		venue: 'stanwellHall',
		when: weekly(['tuesday'], '09:30', '11:30'),
		contacts: [{ kind: 'text', value: '07739 358186', name: 'Victoria' }],
		links: facebook('https://www.facebook.com/groups/270980883516118'),
	},
	{
		name: 'ABC Coffee & Play',
		category: 'stay-and-play',
		whoFor: 'Under 5s',
		ages: under(5),
		venue: 'ashfordBaptist',
		when: weekly(['tuesday'], '09:00', '11:00', true),
		links: facebook('https://www.facebook.com/totsabc/'),
	},
	{
		name: 'NCT Parent Space @ Bumps & Babes',
		category: 'baby-group',
		whoFor: 'Expectant parents and under 2s',
		ages: under(2),
		expecting: true,
		venue: 'openDoor',
		when: weekly(['tuesday'], '10:30', '12:00'),
		links: facebook('https://www.facebook.com/NCTSunburySheppertonandChertsey'),
	},
	{
		name: 'Wombles Stay and Play',
		category: 'stay-and-play',
		whoFor: '0 to 5 years',
		ages: under(6),
		venue: 'stanwellMoor',
		when: weekly(['tuesday'], '09:30', '11:30'),
		links: facebook('https://www.facebook.com/groups/25326865356901771'),
	},
	{ ...rhymetime, venue: 'sheppertonLibrary', when: weekly(['tuesday'], '11:00', '11:30') },
	{
		name: 'Our Lady of the Rosary Church Playgroup',
		category: 'stay-and-play',
		whoFor: '0 to 5 years',
		ages: under(6),
		venue: 'rosary',
		when: weekly(['wednesday'], '09:45', '11:30', true),
	},
	{
		name: 'Footprints Group',
		category: 'stay-and-play',
		whoFor: 'Parents and carers with under 5s',
		ages: under(5),
		venue: 'stPeters',
		when: weekly(['wednesday'], '11:00', '12:30'),
		cost: { kind: 'free' },
		notes: 'No need to book.',
		links: website('https://www.stmaryandstpeterstaines.co.uk/footprints-toddler-group.html'),
	},
	{
		...rhymetime,
		venue: 'ashfordLibrary',
		when: weekly(['wednesday', 'friday', 'saturday'], '10:30', '11:00'),
	},
	{
		name: 'Seedlings',
		category: 'stay-and-play',
		whoFor: 'Pre-schoolers',
		ages: preschool,
		venue: 'stainesBaptist',
		when: weekly(['thursday'], '10:00', '12:00'),
		// The leaflet gives "www.facebook.com/Seedlings Staines", which isn't a working link.
		notes: 'The leaflet says to look for “Seedlings Staines” on Facebook.',
	},
	{
		name: 'Littletots',
		category: 'stay-and-play',
		whoFor: 'Pre-schoolers',
		ages: preschool,
		venue: 'oldSchool',
		when: weekly(['thursday'], '09:30', '11:30'),
	},
	{
		name: 'The Haven Stay & Play',
		category: 'stay-and-play',
		whoFor: 'Pre-school children and their parents or carers',
		ages: preschool,
		venue: 'stSaviours',
		when: weekly(['thursday'], '10:00', '11:45'),
		notes: 'Runs alongside the food bank.',
		links: website('https://www.stsavs.org/foodbank'),
	},
	{
		name: 'NCT Parent Space @ Bumps & Babes',
		category: 'baby-group',
		whoFor: 'Expectant parents and under 2s',
		ages: under(2),
		expecting: true,
		venue: 'sheppertonHall',
		when: weekly(['thursday'], '13:15', '14:45'),
		links: facebook('https://www.facebook.com/NCTSunburySheppertonandChertsey'),
	},
	{
		name: 'Jingle Tots',
		category: 'stay-and-play',
		whoFor: '0 to 4 years',
		ages: under(5),
		venue: 'salvationArmy',
		when: {
			kind: 'regular',
			sessions: [
				{ day: 'friday', start: '09:45', end: '10:30', label: 'Babies' },
				{ day: 'friday', start: '11:15', end: '12:00', label: 'Confident movers' },
			],
		},
		links: facebook('https://www.facebook.com/groups/246577238709883'),
	},
	{
		name: 'Biscuit Playgroup',
		category: 'stay-and-play',
		whoFor: 'Under 5s',
		ages: under(5),
		venue: 'sunburyMethodist',
		when: weekly(['friday'], '09:30', '11:30'),
		contacts: [{ kind: 'text', value: '07944 111479' }],
	},
	{
		name: 'Laleham Parent & Toddler Group',
		category: 'stay-and-play',
		whoFor: 'Pre-school children',
		ages: preschool,
		venue: 'lalehamYouth',
		when: weekly(['friday'], '13:30', '15:00'),
		links: website('https://www.allsaintslaleham.org.uk/parent-and-toddlers'),
	},
	{
		name: 'Little Roots Toddler Group',
		category: 'stay-and-play',
		whoFor: '2 to 5 years',
		ages: { from: 24, to: 72 },
		venue: 'stainesPrep',
		when: weekly(['friday'], '09:00', '10:00'),
		links: website('https://www.stainesprep.co.uk/community/little-roots-playgroup/'),
	},
	{
		name: 'Minnows Toddler Group',
		category: 'stay-and-play',
		whoFor: '0 to 5 years',
		ages: under(6),
		venue: 'stainesMethodist',
		when: weekly(['friday'], '10:00', '11:30'),
		links: website('https://www.stainesmethodist.org.uk/minnows-toddler-group'),
	},
	{ ...rhymetime, venue: 'stanwellLibrary', when: weekly(['friday'], '10:30', '11:00') },
	{
		...rhymetime,
		venue: 'sunburyLibrary',
		when: weekly(['friday', 'saturday'], '10:30', '11:00'),
	},
	{
		name: 'Storytime',
		category: 'stories-and-rhymes',
		summary: 'Stories for the whole family at the library.',
		whoFor: 'All families',
		ages: null,
		venue: 'stainesLibrary',
		when: weekly(['saturday'], '14:30'),
	},
]

/** The seeds with their venues filled in. */
export function seedDetails(): DetailsInput[] {
	return seeds.map(({ venue, ...rest }) => ({
		...rest,
		venue: { ...venues[venue], approximate: true },
	}))
}
