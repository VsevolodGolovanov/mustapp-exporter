<script lang="ts">
	import ListSelector from './(tablecontrols)/ListSelector.svelte';
	import TitleTextFilter from './(tablecontrols)/TitleTextFilter.svelte';
	import Export from './(tablecontrols)/Export.svelte';
</script>

<div class="px-4 py-2 flex justify-between">
	<ListSelector />

	<div class="ml-10">
		<TitleTextFilter />
	</div>

	<!-- push Search to the left -->
	<div class="grow"></div>

	<div class="shrink text-right content-center">
		<Export />
	</div>
</div>
