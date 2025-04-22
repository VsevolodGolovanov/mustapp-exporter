import { error } from '@sveltejs/kit';
import { array, boolean, date, type InferType, number, object, string } from 'yup';
import { Fetch } from '$lib/CurrentContext.svelte';
import _ from 'lodash';
import { sleep } from '$lib';

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
			error(
				response.status,
				`${response.status === 404 ? 'Invalid username?' : ''}\
					Failed to fetch ${response.url}: ${response.statusText}`
			);
		}

		const responseText = await response.text();
		return profileSchema.cast(responseText, { stripUnknown: true });
	}

	public static async getUserProductLists(profile: Profile) {
		// it'd be nice to be able to use _.mapValues, but problematic with async, especially since I
		// want to load the lists strictly sequentially
		let resultLists = {};
		// here and everywhere else I'm going off keys(lists) in case I decide to uncomment
		// `youtube` in the `profileSchema` below
		for (const listKey of Object.keys(profile.lists) as (keyof Profile['lists'])[]) {
			console.log(`Batch fetching ${listKey} list`);
			const list = profile.lists[listKey];
			resultLists = {
				...resultLists,
				[listKey]: await this.getUserProductListBatched(profile.id, list)
			};
		}
		return resultLists as UserProductLists;
	}

	private static async getUserProductListBatched(userId: number, ids: number[]) {
		// when scrolling mustapp.com fetches in batches of 30 - let's try to go a bit bigger, but not
		// too much
		const batchSize = 100;
		// and let's wait between batches a bit to lessen the risk of triggering some DOS protection
		const waitMs = 100;

		const userProductList: UserProductList = [];
		for (const idBatch of _.chunk(ids, batchSize)) {
			// better wait before because we just fetched Profile
			await sleep(waitMs);
			userProductList.push(...(await MustAppService.getUserProductList(userId, idBatch)));
			console.log(`Fetched ${userProductList.length}/${ids.length} items`);
		}

		return userProductList;
	}

	private static async getUserProductList(
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
}

const userProductIdListSchema = array(number().required()).required();

const profileSchema = object({
	id: number().required(),
	lists: object({
		want: userProductIdListSchema,
		shows: userProductIdListSchema,
		watched: userProductIdListSchema
		// youtube: userProductIdListSchema
	}).required()
	// skip other stuff
})
	.required()
	.json();

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
		// "status": "watched",
		// "discussion_id": <id>,
		rate: number().nullable(),
		reviewed: boolean().required(),
		review: object({
			reviewedAt: date(), //"2020-01-01T00:00:00.000000Z"
			body: string()
		})
			.nullable()
			.camelCase()
		// "is_disliked": false,
		// "is_notification_enabled": null
	})
		.required()
		.camelCase(),
	product: object({
		// "id": <id>,
		// "type": "movie",
		title: string().required(),
		releaseDate: date().nullable(), //"2015-01-01"
		// "poster_file_path": "/<...>.jpg"
		// "trailer_url": "https://www.youtube.com/watch?v=<...>"
		itemsCount: number().nullable(), // = released + unreleased
		itemsReleasedCount: number().nullable()
		// "subtitle": null,
		// "runtime": 1000
	})
		.required()
		.camelCase()
}).camelCase();

export type UserProductListEntry = InferType<typeof userProductListEntrySchema>;

const userProductListSchema = array(userProductListEntrySchema).required().json();

export type UserProductList = InferType<typeof userProductListSchema>;

export type UserProductLists = Record<keyof Profile['lists'], UserProductList>;
