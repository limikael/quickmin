import MuiTextField from "@mui/material/TextField";
import {useState} from "react";

export function NumberOption({label, value, onChange}) {
	let [v,setV]=useState(value);

	function handleChange(ev) {
		setV(ev.target.value);
		onChange(Number(ev.target.value));
	}

	return (
		<MuiTextField
			value={v}
			onChange={handleChange}
			margin="dense"
			label={label}
			fullWidth/>
	);
}
