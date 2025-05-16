import JSON5 from "json5";

export function json5ParseObject(s) {
	if (s===undefined)
		return undefined;

	//console.log(s);

	if (!s.trim().startsWith("{"))
		s="{"+s+"}";

	return JSON5.parse(s);
}