import {
	type ListKey,
	type ListKeyedObject,
	listKeys,
	MustAppService,
	type Profile,
	type UserProductList,
	type UserProductLists
} from './(services)/MustAppService';
import { Fetch } from '$lib/CurrentContext.svelte';
import { MustAppClientCacheService } from './(services)/MustAppClientCacheService';
import _ from 'lodash';
import { checkNonNullable } from '$lib/Checks';

export async function load({ fetch, url, params: { username } }) {
	console.log('Loading data for user:', username);

	let profile: Promise<Profile>;
	let fetchTimestamp: Date;
	let userProductLists: Promise<UserProductLists>;

	const cacheService = new MustAppClientCacheService();
	let cacheData;
	if (url.searchParams.has('update')) {
		console.log('Update requested - skipping cache');
	} else {
		cacheData = await cacheService.getData(username);
	}

	let loadingUserProductLists: Record<ListKey, Promise<UserProductList>[]> | null = null;
	if (cacheData) {
		console.log('Found cached data');

		fetchTimestamp = cacheData.fetchTimestamp;
		profile = Promise.resolve(cacheData.profile);
		userProductLists = Promise.resolve(cacheData.userProductLists);
	} else {
		console.log('No cached data - fetching');
		Fetch.set(fetch);

		fetchTimestamp = new Date();

		// separately getting profile and lists here to provide detailed UI feedback

		profile = MustAppService.getProfile(username);

		profile.then((fetchedProfile) => {
			const lists = fetchedProfile.lists;
			console.log(
				`Loaded profile: id=${fetchedProfile.id}, `,
				listKeys.map((lk) => `${lk} ${lists[lk].length}`)
			);

			loadingUserProductLists = MustAppService.getUserProductLists(fetchedProfile);
			// Still need to provide a single Promise resolving to completely resolved de-batched data as
			// well - at the minimum to support a singular data API with caching above; at the maximum
			// because the UI code would have to do something like that anyway. But does that mean that we
			// send the same data twice to the client? Maybe I should do:
			// `loadingUserProductLists.values.map(batch => batch.length)` - that would be enough to
			// track loading progress.
			const allPromises = Object.values(loadingUserProductLists).flat(1);
			userProductLists = Promise.all(allPromises).then(async () => {
				console.log('Assembling loaded userProductLists batches');
				// can't use _.mapValues here, because I need to `await` the batches (ye, this really calls
				// for a Promise-specific library...)

				let resultLists = {};
				checkNonNullable(loadingUserProductLists);
				for (const listKey of Object.keys(loadingUserProductLists) as ListKey[]) {
					const list: UserProductList = (await Promise.all(loadingUserProductLists[listKey])).flat(
						1
					);
					resultLists = {
						...resultLists,
						[listKey]: list
					};
				}
				return resultLists as UserProductLists;
			});

			userProductLists.then((fetchedUserProductLists) => {
				console.log('Fetched user product lists');
				cacheService
					.setData({
						username,
						fetchTimestamp,
						profile: fetchedProfile,
						userProductLists: fetchedUserProductLists
					})
					.then(() => console.log('User data cached'));
			});
		});
	}

	const userdata: Promise<Userdata> = profile.then((fetchedProfile) => {
		const listCounts = _.fromPairs(
			Object.entries(fetchedProfile.lists).map(([key, list]) => {
				return [key, list.length];
			})
		) as ListKeyedObject<number>;

		return {
			listCounts,
			// wow, typescript is smart enough to understand that this `profile.then` is going to be executed after
			// `profile.then` above, and so `userProductLists` is guaranteed to be initialized? pretty cool
			userProductLists,
			loadingUserProductLists
		};
	});

	return {
		username,
		fetchTimestamp,
		userdata
	};
}

export type Userdata = {
	listCounts: ListKeyedObject<number>;
	userProductLists: Promise<UserProductLists>;
	loadingUserProductLists: ListKeyedObject<Promise<UserProductList>[]> | null;
};
