export async function testMethod({id, qql}) {
	await new Promise(r=>setTimeout(r,1000));
	console.log("checking stuff: "+id);
}

export function getJsonTestSchema({item}) {
	console.log("getting schema",item);

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
