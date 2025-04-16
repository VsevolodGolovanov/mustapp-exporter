import { error } from '@sveltejs/kit';
import { array, type InferType, number, object, string } from 'yup';

export class MustAppService {
	public static async getProfile(username: string) {
		const userPageSrc = await this.fetchUserPageSrc(username);
		return this.extractProfileData(userPageSrc);
	}

	private static async fetchUserPageSrc(username: string) {
		const response = await fetch(`https://mustapp.com/@${encodeURIComponent(username)}/want`, {
			method: 'GET',
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

		return profileSchema.cast(profileValueJsonStr, { stripUnknown: true });
	}

	public static async getUserProductList(
		userId: number,
		productIds: number[]
	): Promise<UserProductList> {
		const response = await fetch(
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

const idListSchema = array(number().required()).required();

const profileSchema = object({
	id: number().required(),
	lists: object({
		want: idListSchema,
		shows: idListSchema,
		watched: idListSchema
		// youtube: idListSchema
	}).required()
	// skip other stuff
})
	.required()
	.json();

export type Profile = InferType<typeof profileSchema>;

const userProductListSchema = array(
	object({
		userProductInfo: object({
			// "modified_at": "2020-01-01T00:00:00.000000Z",
			// "user_id": <id>,
			// "product_id": <id>,
			// "status": "watched",
			// "discussion_id": <id>,
			rate: number().nullable()
			// "reviewed": true,
			// "review": {
			// 	"reviewed_at": "2020-01-01T00:00:00.000000Z",
			// 	"body": "review"
			// },
			// "is_disliked": false,
			// "is_notification_enabled": null
		})
			.required()
			.camelCase(),
		product: object({
			// "id": <id>,
			// "type": "movie",
			title: string().required()
			// "release_date": "2015-01-01",
			// "poster_file_path": "/<...>.jpg",
			// "trailer_url": "https://www.youtube.com/watch?v=<...>",
			// "items_count": 0,
			// "items_released_count": 0,
			// "subtitle": null,
			// "runtime": 1000
		})
			.required()
			.camelCase()
	}).camelCase()
)
	.required()
	.json();

export type UserProductList = InferType<typeof userProductListSchema>;
