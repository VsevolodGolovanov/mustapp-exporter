<script lang="ts" module>
	import _ from 'lodash';

	/**
	 * https://stackoverflow.com/a/78907242/1341535
	 */
	export function debouncer<V>(getter: () => V, wait: number): () => V | undefined {
		let current = $state<V>();
		const update = _.debounce(v => current = v, wait);
		$effect(() => update(getter()));

		return () => current;
	}
</script>
