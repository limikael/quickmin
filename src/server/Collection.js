import {parse as parseXml} from "txml";

export default class Collection {
	constructor(id, conf, server) {
        let SQL_TYPES={
            "text": "text",
            "richtext": "text",
            "date": "date",
            "datetime": "datetime",
            "select": "text",
            "image": "text",
            "authmethod": "text",
            "roleselect": "text"
        };

		this.id=id;
        this.fields={};
        this.listFields=[];
        this.role=conf.role;
        this.writeRole=conf.writeRole;
        this.server=server;

        if (this.role && this.server.roles.indexOf(this.role)<0)
            throw new Error("Unknown role: "+this.role);

        if (this.writeRole && this.server.roles.indexOf(this.writeRole)<0)
            throw new Error("Unknown write role: "+this.writeRole);

        this.roleLevel=this.server.roles.indexOf(this.role);
        this.writeRoleLevel=this.server.roles.indexOf(this.writeRole);

        if (this.writeRoleLevel<0)
            this.writeRoleLevel=0;

        if (this.writeRoleLevel<this.roleLevel)
            this.writeRoleLevel=this.roleLevel;

        let fieldEls=parseXml(conf.fields);
        for (let fieldEl of fieldEls) {
            for (let k in fieldEl.attributes)
                if (fieldEl.attributes[k]===null)
                    fieldEl.attributes[k]=true;

            if (fieldEl.attributes.listable)
                this.listFields.push(fieldEl.attributes.id);

            let type=fieldEl.tagName.toLowerCase();
            if (!SQL_TYPES[type])
                throw new Error("Unknown field type: "+type);

            if (type=="roleselect") {
                fieldEl.attributes.choices=this.server.conf.roles;
                fieldEl.attributes.role=true;
            }

            this.fields[fieldEl.attributes.id]={
                type: type,
                sqlType: SQL_TYPES[type],
                children: fieldEl.children,
                ...fieldEl.attributes
            }
        }

        if (!this.listFields.length)
            this.listFields=Object.keys(this.fields);
	}

	getSchema() {
		return {
			id: this.id,
        	fields: this.fields,
        	listFields: this.listFields,
        	roleLevel: this.roleLevel,
        	writeRoleLevel: this.writeRoleLevel
		}
	}

	async handleRequest(req, argv) {
        await this.server.assertRequestRoleLevel(req,this.roleLevel);

        // List.
		if (req.method=="GET" && argv.length==0) {
			let data=await this.server.db.findMany(this.id);
            return Response.json(data,{headers:{"Content-Range": "0-2/2"}});
		}

		// Find.
		if (req.method=="GET" && argv.length==1) {
            let item=await this.server.db.findOne(this.id,{
                id: argv[0]
            });

            if (!item)
                return new Response("Not found",{status: 404});

            return Response.json(item);
        }

        await this.server.assertRequestRoleLevel(req,this.writeRoleLevel);

        // Create.
        if (req.method=="POST" && argv.length==0) {
            return Response.json(await this.server.db.insert(
                this.id,
                await this.server.getRequestFormData(req)
            ));
        }

        // Update.
        if (req.method=="PUT" && argv.length==1) {
            return Response.json(await this.server.db.update(
                this.id,
                argv[0],
                await this.server.getRequestFormData(req)
            ));
        }

        // Delete.
        if (req.method=="DELETE" && argv.length==1) {
            return Response.json(await this.server.db.delete(
                this.id,
                argv[0],
            ));
        }
	}
}