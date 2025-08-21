export async function hashPassword({password, secret}) {
    if (!secret)
        secret="";

    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password+secret);

    // Generate a 16-byte random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Import the password as a key
    const key = await crypto.subtle.importKey(
        "raw",
        passwordData,
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
    );

    // Derive a 256-bit (32-byte) key using PBKDF2 with SHA-256
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 10000, // adjust as needed for desired slowdown
            hash: "SHA-256",
        },
        key,
        256
    );

    // Convert salt and hash to hex for textual storage
    const saltHex = Array.from(new Uint8Array(salt))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

    const hashHex = Array.from(new Uint8Array(derivedBits))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

    // Return in "salt:hash" format
    return `${saltHex}:${hashHex}`;
}

export async function verifyPassword({password, stored, secret}) {
    if (!secret)
        secret="";

    if (!stored)
        return false;

    const [saltHex, hashHex] = stored.split(":");
    const salt = new Uint8Array(saltHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));

    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password+secret);

    const key = await crypto.subtle.importKey(
        "raw",
        passwordData,
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 10000,
            hash: "SHA-256",
        },
        key,
        256
    );

    const derivedHashHex = Array.from(new Uint8Array(derivedBits))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

    return derivedHashHex === hashHex;
}