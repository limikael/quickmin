import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import TextField from "@mui/material/TextField";
import DialogTitle from '@mui/material/DialogTitle';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Button from '@mui/material/Button';
import {useState} from "react";
import {TextInput} from "react-admin";
import FIELD_TYPES from "./field-types.jsx";

function FlowDialog({title, children, onClose}) {
	return (
        <Dialog open={true} fullWidth maxWidth="xs" onClose={onClose}>
            <DialogTitle id="alert-dialog-title">
                {title}
            </DialogTitle>
            {children}
        </Dialog>
	);
}

function Option({id, type, valuesState, ...props}) {
	let [values, setValues]=valuesState;

	if (!type)
		type="text";

	let Comp=FIELD_TYPES[type].option;
	if (!Comp)
		throw new Error("Can't be used as option: "+type);

	function handleChange(eventOrValue) {
		if (eventOrValue instanceof Event)
			eventOrValue=eventOrValue.target.value;

		setValues({...values, [id]: eventOrValue})
	}

	return (
		<Comp {...props} label={id} value={values[id]} onChange={handleChange}/>
	);
}

function OptionDialog({title, helperText, options, onClose}) {
	let [values, setValues]=useState(()=>{
		let def={};

		for (let option of options)
			if (option.hasOwnProperty("default"))
				def[option.id]=option.default;

		return def;
	});

	return (
		<FlowDialog title={title}>
            <DialogContent>
				<DialogContentText>
					{helperText}
				</DialogContentText>
				{options.map(option=>
					<Option {...option} valuesState={[values,setValues]}/>
				)}
            </DialogContent>
            <DialogActions>
                <Button onClick={()=>onClose()}>
                    Cancel
                </Button>
                <Button onClick={()=>onClose(values)}>
                    Ok
                </Button>
            </DialogActions>
        </FlowDialog>
    );
}

export default class ActionFlow {
	constructor({showModal, dismissModal, refresh, formState, selectedIds}) {
		this.showModal=showModal;
		this.dismissModal=dismissModal;
		this.refresh=refresh;
		this.formState=formState;
		this.selectedIds=selectedIds;
	}

	showProgressModal({title}) {
		this.showModal(
			<FlowDialog title={title}>
	            <DialogContent>
	                <DialogContentText>
	                    <Box sx={{ width: '100%' }}>
	                        <LinearProgress />
	                    </Box>
	                </DialogContentText>
	            </DialogContent>
	        </FlowDialog>
		);
	}

	async showErrorModal({title, error}) {
		await this.showModal(
			<FlowDialog title={title} onClose={this.dismissModal}>
	            <DialogContent>
	                <DialogContentText>
                        <div style="color: #f00">
                            {error.message}
                        </div>
	                </DialogContentText>
	            </DialogContent>
                <DialogActions>
                    <Button onClick={this.dismissModal}>
                        Close
                    </Button>
                </DialogActions>
	        </FlowDialog>
		);
	}

	async showOptionsModal({title, helperText, options}) {
		let rec={};

		return await this.showModal(
			<OptionDialog 
					title={title} 
					helperText={helperText}
					options={options}
					onClose={this.dismissModal}/>
		);
	}

	async showMessageModal({title, message}) {
		let content;

		if (typeof message=="string") {
			content=message.split("\n").map(l=>
	            <div>{l}</div>
        	)
        }

        else if (message && message["content-type"]=="text/html") {
        	content=<div dangerouslySetInnerHTML={{ __html: message.body}} />
        }

//		let messageLines=message.split("\n");

		return await this.showModal(
			<FlowDialog title={title}>
	            <DialogContent>
	                <DialogContentText>
	                	{content}
	                </DialogContentText>
	            </DialogContent>
                <DialogActions>
                    <Button onClick={this.dismissModal}>
                        Close
                    </Button>
                </DialogActions>
	        </FlowDialog>
		);
	}

	getIds() {
		if (!this.formState && !this.selectedIds)
			throw new Error("No ids available.");

		if (this.selectedIds)
			return this.selectedIds;

		return [this.formState.defaultValues.id];
	}
}

export function createActionFlow(params) {
	return new ActionFlow(params);
}