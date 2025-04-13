<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="h-screen grid place-items-center">
	<div class="text-center">
		<p class="text-2xl mb-4">
			MustApp Exporter
		</p>

		{@render children()}

	</div>
</div>

