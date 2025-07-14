import urlJoin from "url-join";
import {responseAssert} from "../utils/js-util.js";

export async function changePassword({conf, qql, id, password, repeat_password}) {
	if (!password)
		throw new Error("No password");

	if (password!=repeat_password)
		throw new Error("Doesn't match");

	let response=await fetch(urlJoin(conf.apiUrl,"_changePassword"),{
		method: "POST",
		body: JSON.stringify({
			id: id,
			password: password
		})
	});

	await responseAssert(response);

	return "Password Changed";
}