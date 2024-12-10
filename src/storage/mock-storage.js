export class MockStorage {
    constructor() {}

    async putFile(name, f) {
        throw new Error("can't put a file in mock storage");
    }

    async getResponse(key, req) {
        throw new Error("can't get a file from mock storage");
    }

    async listFiles() {
        throw new Error("can't list files in mock storage");
    }

    async deleteFile(fn) {
        throw new Error("can't delete files in mock storage");
    }
}

export function mockStorageDriver(server) {
    if (!server.isStorageUsed())
        return;

    server.storage=new MockStorage();
}

export default mockStorageDriver;
