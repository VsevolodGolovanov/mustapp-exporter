<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { ExportService } from '../../../../(services)/ExportService';
	import { TableContext } from '../../TableContext.svelte.js';
	import { DownloadOutline } from 'flowbite-svelte-icons';

	const tableContext = TableContext.current();
</script>

<Button on:click={() => ExportService.export(tableContext.userProductLists, tableContext.fetchTimestamp)}>
	<DownloadOutline class="me-2" />
	Export
</Button>
