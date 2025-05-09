import {quickminCanonicalizeConf, parseArrayOrCsvRow,
        canonicalizePolicyForFields} from "../../src/server/quickmin-conf-util.js";

describe("quickmin conf util",()=>{
    it("can canonicalize a policy",()=>{
        let p=canonicalizePolicyForFields({
            roles: "user",
            operations: "create, read, update, delete",
            include: "id, password",
            //writable: "id",
            readonly: "password"
        },["id","name","password"]);

        expect(p).toEqual({
            roles: ["user"],
            operations: ["create","read","update","delete"],
            where: undefined,
            include: ["id","password"],
            writable: ["id"]
        });
    });

    it("can canonicalize a conf",()=>{
        let conf=`
            collections:
              test:
                fields:
                  <Text id="field1"/>
                  <Text id="field2"/>

                policies:
                - roles: admin
                - roles: admin,user
                  operations: read,update
        `;

        let canonicalized=quickminCanonicalizeConf(conf);
        expect(Object.keys(canonicalized.collections.test.fields).length).toEqual(2);
        //console.log(canonicalized.collections.test.policies);
        expect(canonicalized.collections.test.policies).toEqual([
            { roles: [ 'admin' ], operations: ["create","read","update","delete"],  include: [], exclude: [], readonly: [], writable: []},
            { roles: [ 'admin', 'user' ], operations: [ 'read', 'update' ],  include: [], exclude: [], readonly: [], writable: [] }
        ]);
    });

    it("can parse an array or row",()=>{
        expect(parseArrayOrCsvRow(undefined)).toEqual([]);
        expect(parseArrayOrCsvRow(["hello","world"])).toEqual(["hello","world"]);
        expect(parseArrayOrCsvRow("hello,world")).toEqual(["hello","world"]);
        expect(parseArrayOrCsvRow("hello, world")).toEqual(["hello","world"]);
        expect(parseArrayOrCsvRow(true)).toEqual(["true"]);
        expect(parseArrayOrCsvRow(0)).toEqual(["0"]);
    });
});