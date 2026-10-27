import { describe, expect, it } from 'vitest'
import { describeAges, fitsAge, matches } from '../filters'
import { makeListing } from './helpers'

describe('filters', () => {
	const babies = makeListing({ ages: { from: 0, to: 12 }, expecting: true, name: 'Bumps & Babes' })
	const preschool = makeListing({ ages: { from: 24, to: 60 } })
	const everyone = makeListing({ ages: null })

	it('matches age groups by overlap', () => {
		expect(fitsAge(babies, 'baby')).toBe(true)
		expect(fitsAge(babies, 'toddler')).toBe(false)
		expect(fitsAge(babies, 'bump')).toBe(true)
		expect(fitsAge(preschool, 'bump')).toBe(false)
		expect(fitsAge(preschool, 'toddler')).toBe(true)
		expect(fitsAge(preschool, 'preschool')).toBe(true)
		expect(fitsAge(preschool, 'school')).toBe(false)
		expect(fitsAge(everyone, 'school')).toBe(true)
	})

	it('combines filters and searches words in any order', () => {
		const free = makeListing({
			cost: { kind: 'free' },
			venue: { name: 'St Peter’s Hall', address: 'Laleham Road', town: 'Staines' },
		})
		expect(matches(free, { free: true, town: 'Staines' })).toBe(true)
		expect(matches(free, { town: 'Ashford' })).toBe(false)
		expect(matches(babies, { free: true })).toBe(false)
		expect(matches(free, { q: 'laleham peters' })).toBe(true)
		expect(matches(babies, { q: 'bumps and babes' })).toBe(true)
		expect(matches(babies, { q: 'swimming' })).toBe(false)
		expect(matches(babies, { category: 'baby-group' })).toBe(false)
	})

	it('describes ages when the organiser did not', () => {
		expect(describeAges(babies)).toBe('Expectant parents, and under 12 months')
		expect(describeAges(preschool)).toBe('2 to 5 years')
		expect(describeAges(makeListing({ ages: { from: 0, to: 60 } }))).toBe('Under 5s')
		expect(describeAges(everyone)).toBe('All ages')
	})
})
