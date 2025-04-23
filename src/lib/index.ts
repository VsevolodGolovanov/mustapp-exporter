/* eslint-disable @typescript-eslint/no-explicit-any */
// noinspection JSUnusedGlobalSymbols

import _ from 'lodash';

/**
 * Establishes the fact that a value is neither null nor undefined both at runtime (throws an error
 * otherwise) and statically for TypeScript. If you only need to assert statically, then instead of
 * this function just use the "!" operator: for example, "obj!" or "obj!.prop". This function is
 * needed for runtime checking or for static assertion across the entire scope, so you don't have to
 * write the "!" operator on each access.
 *
 * This is an assertion function (not to be confused with type guard):
 * https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions
 *
 * Unfortunately, it's currently impossible to combine returning a value, as Java's checkNotNull
 * does, with a TypeScript assertion. Making the current function return a value and calling an
 * asserting function inside doesn't work - TypeScript won't see the nested assertion in the context
 * of the caller of this function.
 *
 * The error message template and parameters could have been implemented in the style of template
 * literals with named parameters, passing parameters as { param1: "asd", param2: "qwe" }. But this
 * seemed like an unnecessary complication for error messages: if forced to do this, messages would
 * be written less frequently, or would be immediately evaluated upon function call regardless of
 * the check outcome, which is also bad. Simpler is better.
 *
 * @param value the value being checked
 * @param errorMessageFormatString error message template with "%s" for parameter substitution; optional
 * @param errorMessageParams error message parameters to be substituted in the template; optional
 */
export function checkNonNullable<T>(
	value: T,
	errorMessageFormatString?: string,
	...errorMessageParams: any[]
): asserts value is NonNullable<T> {
	// not good to reuse checkState here because it adds an extraneous frame when looking at the error
	//checkState(value != null, errorMessageFormatString, errorMessageParams);

	if (value == null) {
		errorMessageFormatString = errorMessageFormatString || 'value is null or undefined';
		// see this throw in the error message stack? look at frames above in the stack to understand
		// what led to the failure
		throw new Error(formatErrorMessage(errorMessageFormatString, ...errorMessageParams));
	}
}

/**
 * Checks that the condition value is truthy. Throws an error at runtime otherwise. Asserts the
 * condition statically for TypeScript.
 *
 * This is an assertion function (not to be confused with type guard):
 * https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions
 *
 * The error message template and parameters could have been implemented in the style of template
 * literals with named parameters, passing parameters as { param1: "asd", param2: "qwe" }. But this
 * seemed like an unnecessary complication for error messages: if forced to do this, messages would
 * be written less frequently, or would be immediately evaluated upon function call regardless of
 * the check outcome, which is also bad. Simpler is better.
 *
 * @param condition the value being checked
 * @param errorMessageFormatString error message template with "%s" for parameter substitution; optional
 * @param errorMessageParams error message parameters to be substituted in the template; optional
 */
export function checkState(
	condition: any | null | undefined,
	errorMessageFormatString?: string,
	...errorMessageParams: any[]
): asserts condition {
	if (!condition) {
		errorMessageFormatString = errorMessageFormatString || 'condition is falsey';
		// see this throw in the error message stack? look at frames above in the stack to understand
		// what led to the failure
		throw new Error(formatErrorMessage(errorMessageFormatString, ...errorMessageParams));
	}
}

function formatErrorMessage(
	errorMessageFormatString: string,
	...errorMessageParams: any[]
): string {
	const cnt = { i: 0 };
	return errorMessageFormatString.replace(/%s/g, () => {
		// if there are not enough parameters, we leave "%s" - this somewhat supports the case when we
		// have a string that accidentally contains "%s", but parameters weren't actually intended
		// and if parameters are indeed missing, this will be more noticeable
		if (errorMessageParams.length <= cnt.i) return '%s';
		const param = errorMessageParams[cnt.i++];
		// we need to output null as "null", undefined similarly, primitives as they are, and stringify
		// objects - _.toString is not suitable; JSON.stringify does almost everything right, except it
		// adds extra quotes for strings, so we'll handle those separately
		// what if we get functions? strange, but we'll handle those too, otherwise stringify would
		// deceptively produce "undefined"
		return _.isString(param)
			? param
			: _.isFunction(param)
				? param.toString()
				: JSON.stringify(param);
	});
}

/**
 * Sometimes you want to slow something down for debugging. Usage example: `await sleep(2000)`.
 */
export async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
