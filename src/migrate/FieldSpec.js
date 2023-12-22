function makeSqlValue(v) {
	if (v===undefined || v===null)
		return "null";

	if (typeof v=="number" || typeof v=="boolean")
		return String(v);

	if (typeof v=="string")
		return "'"+v.replaceAll("'","''")+"'";

	throw new Error("Unable to sqlify value: "+JSON.stringify(v));
}

export default class FieldSpec {
	constructor(spec) {
		if (spec.pk && !spec.notnull)
			throw new Error("Priary key field is nullable, please fix...");

		Object.assign(this,{
			name: spec.name,
			type: spec.type,
			pk: spec.pk,
			notnull: !!spec.notnull,
			/*reference_table: spec.reference_table,
			reference_field: spec.reference_field*/
		});

		if (spec.defaultSql)
			this.defaultSql=spec.defaultSql;

		else
			this.defaultSql=makeSqlValue(spec.default);
	}

	equals(that) {
		if (!that)
			return false;

		let eq=(
			this.name==that.name
			&& this.type.toUpperCase()==that.type.toUpperCase()
			&& this.pk==that.pk
			&& this.notnull==that.notnull
			&& this.defaultSql==that.defaultSql
		);

		/*if (!eq) {
			console.log(this);
			console.log(that);
			//throw new Error("stop");
		}*/

		return eq;
	}

	static fromSqliteDescribeRow(row) {
		let t=row.type.split("(")[0].toLowerCase();
		if (t=="varchar")
			t="text";

		//console.log(row);

		return new FieldSpec({
			notnull: !!row.notnull,
			name: row.name,
			type: t,
			pk: !!row.pk,
			defaultSql: row.dflt_value
		});
	}

	getSql() {
		let s="`"+this.name+"` ";
		s+=this.type;
		s+=(this.notnull?" not null":" null");
		if (this.defaultSql!=="null")
			s+=" default "+this.defaultSql;

		if (this.pk)
			s+=" primary key";

		return s;
	}

	getExtraSql() {
		/*if (this.reference_table)
			return (
				//`constraint \`${this.name}\` `+
				`foreign key (\`${this.name}\`) `+
				`references ${this.reference_table}(\`${this.reference_field}\`) `+
				`on delete cascade`
			);*/
	}
}