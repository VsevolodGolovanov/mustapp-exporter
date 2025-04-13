<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<form method="POST"
      action="?/getData"
      class="grid w-full min-w-xs max-w-xs"
      use:enhance>
	<input aria-label="Enter Must username"
	       type="text"
	       placeholder="Must username"
	       class="text-sm text-gray-base p-2 border border-gray-200 rounded"
	       name="username"
	       value={form?.username ?? ''}
	       required />
	{#if form?.error}
		<p class="text-red-500">{form.error}</p>
	{/if}
	<button type="submit" class="bg-cyan-400 w-full mt-2 p-1">
		Get data
	</button>
</form>