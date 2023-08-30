export default class FieldSpec {
	constructor(spec) {
		this.null=!spec.pk;

		Object.assign(this,{
			name: spec.name,
			type: spec.type,
			pk: spec.pk,
		});
	}

	equals(that) {
		return (
			this.name==that.name
			&& this.type==that.type
			&& this.pk==that.pk
		);
	}

	static fromSqliteDescribeRow(row) {
		let t=row.type.split("(")[0].toLowerCase();
		if (t=="varchar")
			t="text";

		return new FieldSpec({
			name: row.name,
			type: t,
			pk: !!row.pk,
		});
	}

	getSql() {
		let s=this.type;
		s+=(this.null?" null":" not null");
		if (this.pk)
			s+=" primary key";

		return s;
	}
}