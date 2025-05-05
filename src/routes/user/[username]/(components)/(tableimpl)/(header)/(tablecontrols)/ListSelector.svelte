<script lang="ts">
	import { TabItem, Tabs } from 'flowbite-svelte';
	import { type ListKey, listKeys, listNames } from '../../../../(services)/MustAppService';
	import { TableContext } from '../../TableContext.svelte.js';

	const tableContext = TableContext.current();

	const selectList = (list: ListKey) => {
		tableContext.selectedList = list;
	};
</script>

<!-- I use Tabs without content as the input here, because I prefer them to radio buttons in this
	case visually -->
<Tabs tabStyle="pill" contentClass="hidden" class="tabs flex-none">
	{#each listKeys as listKey (listKey)}
		<TabItem open={tableContext.selectedList === listKey}
		         title={`${listNames[listKey]} (${tableContext.userProductLists[listKey].length})`}
		         on:click={() => selectList(listKey)} />
	{/each}
</Tabs>
