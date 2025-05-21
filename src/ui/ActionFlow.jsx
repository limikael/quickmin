import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Button from '@mui/material/Button';

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
	        <Dialog open={true} fullWidth maxWidth="xs">
	            <DialogTitle id="alert-dialog-title">
	                {title}
	            </DialogTitle>
	            <DialogContent>
	                <DialogContentText>
	                    <Box sx={{ width: '100%' }}>
	                        <LinearProgress />
	                    </Box>
	                </DialogContentText>
	            </DialogContent>
	        </Dialog>
		);
	}

	async showErrorModal({title, error}) {
		await this.showModal(
	        <Dialog open={true} fullWidth maxWidth="xs" onClose={this.dismissModal}>
	            <DialogTitle id="alert-dialog-title">
	                {title}
	            </DialogTitle>
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
	        </Dialog>
		);
	}

	async showOptionsModal({title, options}) {
		return await this.showModal(
	        <Dialog open={true} fullWidth maxWidth="xs">
	            <DialogTitle id="alert-dialog-title">
	                {title}
	            </DialogTitle>
	            <DialogContent>
	                <DialogContentText>
	                	hello...
	                </DialogContentText>
	            </DialogContent>
                <DialogActions>
                    <Button onClick={this.dismissModal}>
                        Close
                    </Button>
                </DialogActions>
	        </Dialog>
		);
	}

	async showMessageModal({title, message}) {
		return await this.showModal(
	        <Dialog open={true} fullWidth maxWidth="xs">
	            <DialogTitle id="alert-dialog-title">
	                {title}
	            </DialogTitle>
	            <DialogContent>
	                <DialogContentText>
	                	{message}
	                </DialogContentText>
	            </DialogContent>
                <DialogActions>
                    <Button onClick={this.dismissModal}>
                        Close
                    </Button>
                </DialogActions>
	        </Dialog>
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