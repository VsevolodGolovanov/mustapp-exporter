<script lang="ts">
	import { Search } from 'flowbite-svelte';
	import { isBlank } from '$lib/Strings';
	import { debouncer } from '$lib/Utils.svelte';
	import type { UserProductList } from '../../../../(services)/MustAppService';
	import { TableContext } from '../../TableContext.svelte.js';

	// `<Table filter` and `TableSearch` force their weird markup and aren't debounced, so I'm going
	// to do my own filter. I don't use `<Table items` anyway, so filtering myself is easy.

	let filterInputValue = $state<string>();

	const filterAppliedValue = $derived.by(debouncer(() => filterInputValue, 300));

	const tableContext = TableContext.current();
	tableContext.applyDataTransformationTitleTextFilter = (userProductList: UserProductList) => {
		console.log(filterAppliedValue ? `Applying title text filter "${filterAppliedValue}"`
			: 'Resetting title text filter');

		if (filterAppliedValue && !isBlank(filterAppliedValue)) {
			return userProductList.filter(upl =>
				upl.product.title.toLowerCase().includes(filterAppliedValue.toLowerCase()));
		} else {
			return userProductList;
		}
	};
</script>

<Search bind:value={filterInputValue} placeholder="Title search" size="md" class="font-normal" />
