import { error } from '@sveltejs/kit';
import { array, boolean, date, type InferType, number, object, string } from 'yup';
import { Fetch } from '$lib/CurrentContext.svelte.js';
import _ from 'lodash';
import { sleep } from '$lib';
import { checkState } from '$lib/Checks';

export class MustAppService {
	public static async getProfile(username: string) {
		// First went with requesting the page `https://mustapp.com/@<username>/want` and scraping
		// `profile` from `window._start_data`, but that of course had to be requested server-side
		// due to CORS. Then I realized GET https://mustapp.com/api/users/id/257617 returns the same
		// data, but you still need the id. Finally, I discovered that querying by the `uri` field
		// also works.
		const response = await Fetch.get()(
			`https://mustapp.com/api/users/uri/${encodeURIComponent(username)}`,
			{
				method: 'GET',
				cache: 'reload'
			}
		);

		if (!response.ok) {
			const responseBody = await response.json();
			error(
				response.status,
				`Failed to fetch Must user data: ${_.lowerFirst(responseBody?.error?.message)}`
			);
		}

		const responseText = await response.text();
		return profileSchema.cast(responseText, { stripUnknown: true });
	}

	/**
	 * Returns n Promises for each list to allow the UI to track progress.
	 *
	 * Of course, knowing that this also executes client-side I could've kept it simple here by
	 * returning a single Promise and achieving sequential execution with `await`s, and just tracked
	 * progress via some shared $state. But I wanted to do this in a universal way, as if this could
	 * execute server-side. Svelte does seem to support real streaming, but I'm not sure if it's
	 * supported universally or only server-side, and there is no documentation currently:
	 * https://stackoverflow.com/questions/74879852/how-can-i-implement-server-sent-events-sse-in-sveltekit
	 * So I'm going with Promises.
	 *
	 * There are ofc libraries for sequential execution, e.g.: https://www.npmjs.com/package/p-queue,
	 * https://github.com/sindresorhus/promise-fun; probably there are even libraries for simulating
	 * multi-resolvable Promises or something like semaphores to track progress. But I'm here to learn
	 * and explore, so I want to do this myself this time.
	 *
	 * @param profile
	 */
	public static getUserProductLists(profile: Profile) {
		const accumulator = _.reduce(
			listKeys,
			(accumulator, listKey) => {
				const value = profile.lists[listKey];
				console.log(`Scheduling ${listKey} list batch fetch`);

				// chaining the list fetches via `previousBatch` because I want to load them strictly
				// sequentially
				const listBatched = this.getUserProductListBatched(
					accumulator.previousBatch,
					profile.id,
					value,
					listKey
				);

				accumulator.result = {
					...accumulator.result,
					[listKey]: listBatched
				};
				if (listBatched.length > 0) {
					accumulator.previousBatch = listBatched.at(-1)!;
				}
				return accumulator;
			},
			{ result: {}, previousBatch: Promise.resolve<unknown>(null) }
		);
		return accumulator.result as Record<ListKey, Promise<UserProductList>[]>;
	}

	// when scrolling mustapp.com fetches in batches of 30 - let's try to go a bit bigger, but not too
	// much
	private static readonly batchSize = 100;
	// and let's wait between batches a bit to lessen the risk of triggering some DOS protection
	private static readonly waitMs = 100;

	private static getUserProductListBatched(
		previousBatch: Promise<unknown>,
		userId: number,
		ids: number[],
		listKey: ListKey
	) {
		const batches: Promise<UserProductList>[] = [];
		for (const idBatch of _.chunk(ids, this.batchSize)) {
			const batch = previousBatch.then(async () => {
				// better wait before fetching because at first iteration we just fetched Profile, and at
				// last iteration no need to wait after fetching
				await sleep(this.waitMs);

				const userProducts = await this.getUserProducts(userId, idBatch);

				// need to request shows last rate and review separately
				// for implementation simplicity we'll chain these subbatches in with `awaits` and merge the
				// results into `userProducts` - without exposing them to UI via `batches`
				if (listKey === 'shows') {
					await this.augmentWatchedShowUserProducts(userId, idBatch, userProducts);
				}

				return userProducts;
			});
			batches.push(batch);
			previousBatch = batch;
			// const scheduledEntries = Math.min(batches.length * this.batchSize, ids.length);
			// console.log(`Scheduled batch fetch of ${scheduledEntries}/${ids.length} entries`);
		}

		return batches;
	}

	private static async augmentWatchedShowUserProducts(
		userId: number,
		idBatch: number[],
		userProducts: UserProductList
	) {
		// console.log('augmentWatchedShowUserProducts');

		await sleep(this.waitMs);
		// Map of productId -> stats
		const showWatchedStats = new Map(
			(await this.getShowWatchedStats(userId, idBatch)).map((stats) => [stats.productId, stats])
		);
		checkState(userProducts.length === showWatchedStats.size);

		for (const userProduct of userProducts) {
			const showStats: ShowWatchedStatsEntry = showWatchedStats.get(userProduct.product.id)!;

			// let's just put these things into userProduct - those fields are unused for shows and
			// fit perfectly
			userProduct.userProductInfo.rate = showStats.lastSeasonRate;
			userProduct.userProductInfo.reviewed = showStats.lastSeasonReviewed;
		}

		// Map of productId -> seasonId
		const reviewedLastSeasonIds = new Map(
			showWatchedStats
				.values()
				.filter((s) => s.lastSeasonReviewed)
				.map((s) => {
					// "last_season_rate" and "last_season_reviewed" actually refer to last _watched_
					// season - so it's the last in `watchedSeasons`
					return [s.watchedSeasons.at(-1)!, s.productId];
				})
		);

		await sleep(this.waitMs);
		const seasonUserProducts = await this.getUserProducts(
			userId,
			reviewedLastSeasonIds.keys().toArray()
		);

		checkState(reviewedLastSeasonIds.size === seasonUserProducts.length);
		for (const seasonUserProduct of seasonUserProducts) {
			const productId = reviewedLastSeasonIds.get(seasonUserProduct.product.id);

			// again, let's just put the review into userProduct
			const userProduct = userProducts.find((up) => up.product.id === productId)!;
			// and clone just to be safe
			userProduct.userProductInfo.review = _.cloneDeep(seasonUserProduct.userProductInfo.review);
		}
	}

	private static async getUserProducts(
		userId: number,
		productIds: number[]
	): Promise<UserProductList> {
		// getting preflight OPTIONS requests here if requesting client-side. oh, well...
		const response = await Fetch.get()(
			`https://mustapp.com/api/users/id/${userId}/products?embed=product,review`,
			{
				method: 'POST',
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify({ ids: productIds }),
				cache: 'reload'
			}
		);

		if (!response.ok) {
			error(response.status, `Failed to fetch ${response.url}: ${response.statusText}`);
		}

		const responseText = await response.text();
		return userProductListSchema.cast(responseText, { stripUnknown: true });
	}

	private static async getShowWatchedStats(
		userId: number,
		productIds: number[]
	): Promise<ShowWatchedStatsList> {
		const response = await Fetch.get()(
			`https://mustapp.com/api/users/id/${userId}/shows/watched_stats`,
			{
				method: 'POST',
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify({ ids: productIds }),
				cache: 'reload'
			}
		);

		if (!response.ok) {
			error(response.status, `Failed to fetch ${response.url}: ${response.statusText}`);
		}

		const responseText = await response.text();
		return showWatchedStatsListSchema.cast(responseText, { stripUnknown: true });
	}
}

const userProductIdListSchema = array(number().required())
	.default(() => [])
	.required();

// this is the source of truth, establishing the lists we're interested in; also defines order in UI etc (same as at
// must.com and in the Must app)
export const listKeys = ['want', 'watched', 'shows'] as const;

export type ListKeysTuple = typeof listKeys;
export type ListKey = ListKeysTuple[number];

export type ListKeyedObject<VALUE> = {
	[listKey in ListKey]: VALUE;
};

// same names as at must.com and in the Must app
export const listNames: ListKeyedObject<string> = {
	want: 'Want',
	watched: 'Watched',
	shows: 'Series'
};

const profileSchema = object({
	id: number().required(),
	lists: object<object, ListKeyedObject<typeof userProductIdListSchema>>({
		want: userProductIdListSchema,
		watched: userProductIdListSchema,
		shows: userProductIdListSchema
		// youtube: userProductIdListSchema
	}),
	isPrivate: boolean().required()
	// skip other stuff
})
	.required()
	.json()
	.camelCase();

export type Profile = InferType<typeof profileSchema>;

const userProductListEntrySchema = object({
	userProductInfo: object({
		modifiedAt: date(), // "2020-01-01T00:00:00.000000Z"
		// shows only:
		userShowInfo: object({
			episodesWatched: number()
			// 	"first_unwatched_episode": <id>
		}).camelCase(),
		// "user_id": <id>,
		// "product_id": <id>,
		// status: string().oneOf(['watched', 'want']).required(),
		// "discussion_id": <id>,
		rate: number().defined().nullable(),
		reviewed: boolean().required(),
		review: object({
			reviewedAt: date(), //"2020-01-01T00:00:00.000000Z"
			body: string()
		})
			.defined()
			.nullable()
			.camelCase()
		// "is_disliked": false,
		// "is_notification_enabled": null
	})
		.required()
		.camelCase(),
	product: object({
		id: number().required(),
		// type: string().oneOf(['movie', 'show']).required(),
		title: string().required(),
		releaseDate: date().defined().nullable(), //"2015-01-01"
		// "poster_file_path": "/<...>.jpg"
		// "trailer_url": "https://www.youtube.com/watch?v=<...>"
		itemsCount: number().defined().nullable(), // = released + unreleased
		itemsReleasedCount: number().defined().nullable()
		// "subtitle": null,
		// "runtime": 1000
	})
		.required()
		.camelCase()
}).camelCase();

export type UserProductListEntry = InferType<typeof userProductListEntrySchema>;

const userProductListSchema = array(userProductListEntrySchema).required().json();

export type UserProductList = InferType<typeof userProductListSchema>;

export type UserProductLists = Record<ListKey, UserProductList>;

const showWatchedStatsEntrySchema = object({
	productId: number().required(),
	lastSeasonRate: number().defined().nullable(),
	lastSeasonReviewed: boolean().required(),
	// "has_more_reviews": false,
	watchedSeasons: array(number().required()).required()
})
	.required()
	.camelCase();

type ShowWatchedStatsEntry = InferType<typeof showWatchedStatsEntrySchema>;

const showWatchedStatsListSchema = array(showWatchedStatsEntrySchema).required().json();

type ShowWatchedStatsList = InferType<typeof showWatchedStatsListSchema>;
