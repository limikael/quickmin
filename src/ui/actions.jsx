import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {Button} from "react-admin";
import {useRef} from "react";
import {useEventUpdate} from "../utils/react-util.jsx";
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import {createQuickRpcProxy} from "fullstack-utils/quick-rpc";

class ActionState extends EventTarget {
    constructor(refresh) {
        super();

        this.refresh=refresh;
    }

    async runBrowserAction(action, id) {
        let url=new URL(action.url,window.location);
        url.searchParams.set("id",id);

        let message=new Promise(resolve=>{
            function listener(ev) {
                window.removeEventListener("message",listener);
                resolve(ev.data);
            }

            window.addEventListener("message",listener);
        });

        let iframe=document.createElement('iframe');
        iframe.src=url;

        document.body.appendChild(iframe);
        console.log("action started, waiting for message");
        let data=await message;
        document.body.removeChild(iframe);

        return data;
    }

    async runJsonRpcAction(action, id) {
        let h=new Headers();
        let token=window.localStorage.getItem("token");
        if (token)
            h.set("authorization","Bearer "+token);

        let rpc=createQuickRpcProxy({url: action.url, headers: h});

        console.log("running json rpc action...");
        try {
            let result=await rpc[action.method](id);
            return {
                result: result
            }
        }

        catch (e) {
            console.error(e);
            return {
                error: e.message
            }
        }
    }

    // not working...
    async runModuleAction(action, id) {
        let moduleUrl=new URL(action.url,window.location);

        let htmlString=`
            <script type="module">
                console.log("importing module");
                let mod=await import("${moduleUrl}");
                console.log("imported...");
                console.log(mod);
            </script>
        `;

        let iframe=document.createElement('iframe');
        iframe.src="data:text/html;charset=utf-8," + escape(htmlString);
        document.body.appendChild(iframe);

        await new Promise(r=>{});
    }

    async runSingleAction(action, id) {
        let type=action.type;
        if (!type)
            type="browser";

        try {
            switch (type) {
                case "jsonrpc":
                    return await this.runJsonRpcAction(action,id);
                    break;

                case "browser":
                    return await this.runBrowserAction(action,id);
                    break;

                case "module":
                    return await this.runModuleAction(action,id);
                    break;

                default:
                    throw new Error("Unknown action type: "+type);
                    break;
            }
        }

        catch (e) {
            return {error: String(e)}
        }
    }

    async runAction(action, ids) {
        //console.log("running action "+action.name+" on: "+ids);
        this.currentAction=action;
        this.complete=false;
        this.result=null;
        this.error=null;
        this.dispatchEvent(new Event("change"));

        let data={result: null, error: null};
        for (let id of ids) {
            if (!data.error)
                data=await this.runSingleAction(action,id);
        }

        this.result=data.result;
        this.error=data.error;
        this.complete=true;

        if (!this.result && !this.error)
            this.close();

        this.refresh();
        this.dispatchEvent(new Event("change"));
    }

    async runGlobalAction(action) {
        this.currentAction=action;
        this.complete=false;
        this.result=null;
        this.error=null;
        this.dispatchEvent(new Event("change"));

        let data=await this.runSingleAction(action);

        this.result=data.result;
        this.error=data.error;
        this.complete=true;

        if (!this.result && !this.error)
            this.close();

        this.refresh();
        this.dispatchEvent(new Event("change"));
    }

    close=()=>{
        if (!this.complete)
            return;

        this.currentAction=null;
        this.dispatchEvent(new Event("change"));
    }
}

export function useActionState(refresh) {
    let actionStateRef=useRef();
    if (!actionStateRef.current)
        actionStateRef.current=new ActionState(refresh);

    useEventUpdate(actionStateRef.current,"change");

    return actionStateRef.current;
}

export function ActionDialog({actionState}) {
    useEventUpdate(actionState,"change");

    let show=!!actionState.currentAction;

    return (
        <Dialog open={show} fullWidth maxWidth="xs" onClose={actionState.close}>
            {show && <>
                <DialogTitle id="alert-dialog-title">
                    {actionState.currentAction.name}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {!actionState.complete &&
                            <Box sx={{ width: '100%' }}>
                                <LinearProgress />
                            </Box>
                        }
                        {actionState.result}
                        <div style="color: #f00">
                            {actionState.error}
                        </div>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={actionState.close} 
                            disabled={!actionState.complete}>
                        Close
                    </Button>
                </DialogActions>
            </>}
        </Dialog>
    )
}
