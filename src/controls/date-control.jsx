import {makeNameFromSymbol} from "../utils/js-util.js";

export function DateOption({label, value, onChange}) {
	let style={
		width: "100%",
		marginTop: "8px",
		marginBottom: "4px",
		padding: "15px",
		borderRadius: "4px",
		border: "1px solid #c0c0c0"
	};

	let labelStyle={
		position: "absolute",
		backgroundColor: "#ffffff",
		top: "0px",
		left: "8px",
		padding: "0 4px 0 4px",
		color: "#404040",
		fontSize: "12px"
	}

	return (
		<div style={{position: "relative"}}>
			<input type="date" style={style} value={value} onChange={onChange}/>
			<div style={labelStyle}>
				{makeNameFromSymbol(label)}
			</div>
		</div>
	);
}
