/**
 * Sometimes you want to slow something down for debugging. Usage example: `await sleep(2000)`.
 */
export async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
