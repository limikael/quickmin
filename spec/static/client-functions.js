export async function testMethod({id, qql}) {
	console.log("checking stuff: "+id);
}

export function getJsonTestSchema() {
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
	            "enum": [1,2,3,"something","somethingelse"],
	            "default": 3
	        }
        }
    }
}
