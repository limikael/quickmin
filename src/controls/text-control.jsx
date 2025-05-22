import MuiTextField from "@mui/material/TextField";

export function TextOption({label, value, onChange}) {
	return (
		<MuiTextField
			value={value}
			onChange={ev=>onChange(ev.target.value)}
			margin="dense"
			label={label}
			fullWidth/>
	);
}
