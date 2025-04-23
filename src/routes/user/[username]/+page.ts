import { MustAppService, type Profile, type UserProductLists } from './MustAppService';
import { Fetch } from '$lib/CurrentContext.svelte';
import { MustAppClientCacheService } from './MustAppClientCacheService';

export async function load({ fetch, url, params: { username } }) {
	console.log('Loading data for user:', username);

	let profile: Profile;
	let fetchTimestamp: Date;
	let userProductLists: Promise<UserProductLists>;

	const cacheService = new MustAppClientCacheService();
	let cacheData;
	if (url.searchParams.has('update')) {
		console.log('Update requested - skipping cache');
	} else {
		cacheData = await cacheService.getData(username);
	}

	if (cacheData) {
		console.log('Found cached data');

		fetchTimestamp = cacheData.fetchTimestamp;
		profile = cacheData.profile;
		userProductLists = Promise.resolve(cacheData.userProductLists);
	} else {
		console.log('No cached data - fetching');
		Fetch.set(fetch);

		fetchTimestamp = new Date();

		// separately getting profile and lists here to provide detailed UI feedback

		profile = await MustAppService.getProfile(username);
		const lists = profile.lists;
		console.log(
			`Loaded profile: id=${profile.id}, want ${lists.want.length}, ` +
				`shows ${lists.shows.length}, watched ${lists.watched.length}`
		);

		userProductLists = MustAppService.getUserProductLists(profile);
		userProductLists.then((upLists) => {
			console.log('Fetched lists');
			cacheService
				.setData({ username, fetchTimestamp, profile, userProductLists: upLists })
				.then(() => console.log('userProductLists cached'));
		});
	}

	return {
		username,
		fetchTimestamp,
		userId: profile.id,
		userProductLists
	};
}
