export function getElementsByTagName(children, tagName) {
	let res=[];

	for (let child of children)
		if (child.tagName==tagName)
			res.push(child);

	return res;

}

export function getElementByTagName(children, tagName) {
	return getElementsByTagName(children,tagName)[0];
}