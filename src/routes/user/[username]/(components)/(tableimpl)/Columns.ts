import type { ListKey } from '../../(services)/MustAppService';

// Svelte advises against using enums, so just an object
/** All possible columns. */
export const Cols = {
	Title: 'Title',
	ReleaseDate: 'Release date',
	ModifiedAt: 'Modified',
	Rating: 'Rating',
	HasReview: 'Review',
	Episodes: 'Watched/Released(/Total)'
} as const;

export type ColNames = (typeof Cols)[keyof typeof Cols];

export const columns: { [listKey in ListKey]: ColNames[] } = {
	want: [Cols.Title, Cols.ReleaseDate, Cols.ModifiedAt],
	shows: [
		Cols.Title,
		Cols.ReleaseDate,
		Cols.ModifiedAt,
		Cols.Episodes,
		Cols.Rating,
		Cols.HasReview
	],
	watched: [Cols.Title, Cols.ReleaseDate, Cols.ModifiedAt, Cols.Rating, Cols.HasReview]
};
