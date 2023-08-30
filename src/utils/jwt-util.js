import jsrsasign from "jsrsasign";

export function jwtSign(payload, secret) {
	let header = {alg: 'HS256', typ: 'JWT'};

	return jsrsasign.jws.JWS.sign(
		"HS256",
		JSON.stringify(header),
		JSON.stringify(payload),
		secret
	);
}

export function jwtVerify(jwt, secret) {
	if (!jsrsasign.jws.JWS.verifyJWT(jwt,secret,{alg: ['HS256']}))
		throw new Error("Unable to verify token.");

	let header=jsrsasign.jws.JWS.readSafeJSONString(jsrsasign.b64utoutf8(jwt.split(".")[0]));
	let payload=jsrsasign.jws.JWS.readSafeJSONString(jsrsasign.b64utoutf8(jwt.split(".")[1]));

	//console.log(header);
	//console.log(payload);

	return payload;
}