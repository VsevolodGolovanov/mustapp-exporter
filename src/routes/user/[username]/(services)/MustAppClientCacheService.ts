import Dexie, { type EntityTable } from 'dexie';
import type { Profile, UserProductLists } from './MustAppService';

export class MustAppClientCacheService {
	public constructor(
		readonly db = new Dexie('MustAppClientCacheServiceDB') as Dexie & {
			data: EntityTable<CacheData, 'username'>;
		}
	) {
		// XXX don't forget to increment the version if changing the db schema/contents!
		const version = 10; // increment by 2 at a time!
		// double version init to drop everything on version change:
		// https://github.com/dexie/Dexie.js/issues/349#issuecomment-1537434507
		this.db.version(version).stores({
			data: null
		});
		this.db.version(version + 1).stores({
			data: '&username'
		});
	}

	public async getData(username: string): Promise<CacheData | undefined> {
		return this.db.data.get(username);
	}

	public async setData(cacheData: CacheData) {
		await this.db.data.put(cacheData);
	}
}

export type CacheData = {
	username: string;
	fetchTimestamp: Date;
	profile: Profile;
	userProductLists: UserProductLists;
};
