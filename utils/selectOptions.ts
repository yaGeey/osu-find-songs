const sortOptionValues = ['bpm', 'newest', 'rating'] as const
export type SortOptionValue = (typeof sortOptionValues)[number]
