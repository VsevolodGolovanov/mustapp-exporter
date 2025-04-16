import { error } from '@sveltejs/kit';

export class MustAppService {
	public static async getProfile(username: string) {
		const userPageSrc = await this.fetchUserPageSrc(username);
		return this.extractProfileData(userPageSrc);
	}

	private static async fetchUserPageSrc(username: string) {
		const response = await fetch(`https://mustapp.com/@${encodeURIComponent(username)}/want`, {
			method: 'GET',
			headers: {
				'content-type': 'text/html'
			},
			cache: 'reload'
		});

		if (!response.ok) {
			error(
				response.status,
				`${response.status === 404 ? 'Invalid username?' : ''}\
			Failed to fetch ${response.url}: ${response.statusText}`
			);
		}

		return response.text();
	}

	private static extractProfileData(userPageSrc: string) {
		const startDataIdx = userPageSrc.indexOf('window._start_data =');

		const profileFieldStart = 'profile:';
		const profileValueStartIdx =
			userPageSrc.indexOf(profileFieldStart, startDataIdx) + profileFieldStart.length;

		const profileValueEndIdx = userPageSrc.indexOf(',\n', profileValueStartIdx);

		const profileValueJsonStr = userPageSrc.substring(profileValueStartIdx, profileValueEndIdx);

		return JSON.parse(profileValueJsonStr) as Profile;
	}
}

// only the stuff we need
export type Profile = {
	lists: {
		want: number[];
		shows: number[];
		watched: number[];
		youtube: number[];
	};
	id: number;
};
