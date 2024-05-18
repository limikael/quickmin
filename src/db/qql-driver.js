export function quickminQqlDriver(server) {
    if (!server.conf.qqlDriver)
        throw new Error("No qql driver configured");

    server.qqlDriver=server.conf.qqlDriver;
}

export default quickminQqlDriver;