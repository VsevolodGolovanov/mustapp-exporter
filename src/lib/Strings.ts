/**
 * Is string empty or contains only whitespace.
 */
export function isBlank(str: string): boolean {
	return str.match(/^\s*$/) !== null;
}
