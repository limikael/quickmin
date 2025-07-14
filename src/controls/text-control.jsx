import MuiTextField from "@mui/material/TextField";

export function TextOption({label, value, password, onChange}) {
	let type;
	if (password)
		type="password";

	return (
		<MuiTextField
			type={type}
			value={value}
			onChange={ev=>onChange(ev.target.value)}
			margin="dense"
			label={label}
			fullWidth/>
	);
}
