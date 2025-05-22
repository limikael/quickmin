export async function getChoices({item, qql}) {
	await new Promise(r=>setTimeout(r,1000));

	let pages=await qql({manyFrom: "pages"});
	pages=pages.map(p=>({id: p.id, name: p.title}));
	pages.push({id: "published", name: "Published"});

	return pages;
}

export async function testGlobal({qql}) {
	await qql({insertInto: "posts", set: {title: "Global create..."}});

	return "testing global...";
}

export async function testMethod({id, qql, start_date, num, file, sel}) {
	console.log("start date: "+start_date);
	console.log("file: ",file);

	if (file)
		console.log("data: ",await file.text());

	console.log("sel: ",sel);

	let item=await qql({oneFrom: "posts", where: {id: id}});

	if (!item.views)
		item.views=0;

	item.views+=num;

	await qql({update: "posts", set: {views: item.views}, where: {id: id}});

	return ("increased by: "+num);
}

export function getJsonTestSchema({item}) {
	//console.log("getting schema",item);

	switch (item.jsontype) {
		case "person":
			return {
				"type": "object",
				"properties": {
					"name": {
			            "title": "The Name",
						"description": "The name of the person",
						"default": "micke",
			            "type": "string",
					}
				}
			}
			break;

		case "thing":
		    return {
		        "type": "object",
		        "properties": {
		            "review": {
			            "title": "The Review",
			            "description": "The review of the content.",
			            "type": "string",
			            "default": "default review xyz"
		            },
			        "data": {
			            "description": "Should we do it?",
			            "type": "string",
			            "enum": ["1","2","3","something","somethingelse"],
			            "default": "3"
			        }
		        }
		    }
			break;
	}
}
