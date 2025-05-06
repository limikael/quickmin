import {quickminCanonicalizeConf, parseArrayOrCsvRow,
        canonicalizePolicy} from "../../src/server/quickmin-conf-util.js";

describe("quickmin conf util",()=>{
    it("can canonicalize a policy",()=>{
        let p=canonicalizePolicy({
            roles: "user",
            operations: "create, read, update, delete",
            include: "id"
        },["id","name","password"]);

        expect(p).toEqual({
            roles: ["user"],
            operations: ["create","read","update","delete"],
            where: undefined
        });
    });

    /*it("can canonicalize a conf",()=>{
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
            { roles: [ 'admin' ], operations: [] },
            { roles: [ 'admin', 'user' ], operations: [ 'read', 'update' ] }
        ]);
    });*/

    it("can parse an array or row",()=>{
        expect(parseArrayOrCsvRow(undefined)).toEqual([]);
        expect(parseArrayOrCsvRow(["hello","world"])).toEqual(["hello","world"]);
        expect(parseArrayOrCsvRow("hello,world")).toEqual(["hello","world"]);
        expect(parseArrayOrCsvRow("hello, world")).toEqual(["hello","world"]);
        expect(parseArrayOrCsvRow(true)).toEqual(["true"]);
        expect(parseArrayOrCsvRow(0)).toEqual(["0"]);
    });
});