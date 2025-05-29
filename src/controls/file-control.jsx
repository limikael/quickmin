import {makeNameFromSymbol} from "../utils/js-util.js";
import {useState} from "react";

export function FileOption({label, value, onChange}) {
	let [v,setV]=useState();

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

	function handleChange(ev) {
		setV(ev.target.value);
		onChange(ev.target.files[0]);
	}

	return (
		<div style={{position: "relative"}}>
			<input type="file" style={style} value={v} onChange={handleChange}/>
			<div style={labelStyle}>
				{makeNameFromSymbol(label)}
			</div>
		</div>
	);
}
