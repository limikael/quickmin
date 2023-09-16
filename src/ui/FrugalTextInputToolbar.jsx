import {styled} from '@mui/material/styles';
import {ToggleButton,ToggleButtonGroup} from '@mui/material';
import { List, ListItem, ListItemText, Menu, MenuItem, Select } from '@mui/material';
import {useEventListener, useForceUpdate} from "../utils/react-util.jsx";
import {useState, useRef} from "react";
import urlJoin from "url-join";

import FormatBold from '@mui/icons-material/esm/FormatBold';
import FormatItalic from '@mui/icons-material/esm/FormatItalic';
import FormatUnderlined from '@mui/icons-material/esm/FormatUnderlined';
import FormatStrikethrough from '@mui/icons-material/esm/FormatStrikethrough';
import Code from '@mui/icons-material/esm/Code';
import FormatAlignLeft from '@mui/icons-material/esm/FormatAlignLeft';
import FormatAlignCenter from '@mui/icons-material/esm/FormatAlignCenter';
import FormatAlignRight from '@mui/icons-material/esm/FormatAlignRight';
import FormatAlignJustify from '@mui/icons-material/esm/FormatAlignJustify';
import FormatListBulleted from '@mui/icons-material/esm/FormatListBulleted';
import FormatListNumbered from '@mui/icons-material/esm/FormatListNumbered';
import Link from '@mui/icons-material/esm/Link';
import Image from '@mui/icons-material/esm/Image';

export function FrugalTextInputToolbar({dispatcher, disabled, apiPath, httpClient}) {
    let toolbarState=useRef({marks:[], level:"normal"});
    let forceUpdate=useForceUpdate();
    let fileInputRef=useRef();

    function updateToolbarState() {
        let newState={
            marks: []
        };

        let marks=["bold","italic","strike","code","bulletList","orderedList","link"];
        for (let mark of marks)
            if (dispatcher.editor.isActive(mark))
                newState.marks.push(mark);

        for (let align of ["left","right","center","justify"])
            if (dispatcher.editor.isActive({textAlign: align}))
                newState.marks.push(align);

        newState.level="";
        if (dispatcher.editor.isActive("paragraph"))
            newState.level="normal"

        for (let i=1; i<6; i++)
            if (dispatcher.editor.isActive("heading",{level: i}))
                newState.level=String(i);

        if (JSON.stringify(newState)!=JSON.stringify(toolbarState.current)) {
            toolbarState.current=newState;
            forceUpdate();
        }
    }

    useEventListener(dispatcher,"create",updateToolbarState);
    useEventListener(dispatcher,"transaction",updateToolbarState);

    async function onFileInputChange(ev) {
        let editor=dispatcher.editor;
        ev.preventDefault();

        let formData=new FormData();
        formData.append("file",fileInputRef.current.files[0]);

        //console.log("sending to: "+urlJoin(apiPath,"_upload"));
        let response=await httpClient(urlJoin(apiPath,"_upload"),{
            method: "post",
            body: formData
        });

        let file=response.json.file;
        let fileUrl=urlJoin(apiPath,"_content",file);

        editor.chain().focus().setImage({src: fileUrl}).run();

        console.log("uploaded: "+fileUrl);

        fileInputRef.current.value="";
    }

    function onToggle(ev, value) {
        switch (value) {
            case "bold":
            case "italic":
            case "strike":
            case "code":
                dispatcher.editor.commands.toggleMark(value);
                break;

            case "left":
            case "right":
            case "center":
            case "justify":
                dispatcher.editor.commands.setTextAlign(value);
                //dispatcher.editor.chain().focus().setTextAlign(value).run();
                break;

            case "bulletList":
                dispatcher.editor.commands.toggleBulletList();
                break;

            case "orderedList":
                dispatcher.editor.commands.toggleOrderedList();
                break;

            case "link":
                let editor=dispatcher.editor;
                const previousUrl=editor.getAttributes('link').href;
                const url=window.prompt('URL', previousUrl);

                if (url===null)
                    return;

                if (url==='') {
                    editor.chain().focus()
                        .extendMarkRange('link').unsetLink()
                        .run();
                    return;
                }

                editor.chain().focus()
                    .extendMarkRange('link').setLink({href: url})
                    .run();
                break;

            case "image":
                fileInputRef.current.value="";
                fileInputRef.current.click();
                break;
        }

        dispatcher.editor.commands.focus();
    }

    function onLevelSelect(ev, item) {
        let value=item.props.value;
        if (value=="normal")
            dispatcher.editor.commands.setParagraph();

        else
            dispatcher.editor.commands.setHeading({level: Number(value)});
    }

    function markButtons(buttons) {
        return Object.keys(buttons).map(btn=>{
            let Button=buttons[btn];
            return (
                <ToggleButton key={btn} value={btn} onClick={onToggle} disabled={disabled}>
                    <Button />
                </ToggleButton>
            );
        });
    }

    return (
        <Root className={classes.root}>
            <Select style={{width: "8em", height: "2.7em", "font-size": "0.8em"}}
                    value={toolbarState.current.level}
                    onChange={onLevelSelect} disabled={disabled}>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="1">Header</MenuItem>
                <MenuItem value="2">Subheader</MenuItem>
            </Select>

            <ToggleButtonGroup value={toolbarState.current.marks}>
                {markButtons({
                    "bold": FormatBold,
                    "italic": FormatItalic,
                    "strike": FormatStrikethrough,
                    "code": Code,
                })}
            </ToggleButtonGroup>

            <ToggleButtonGroup value={toolbarState.current.marks}>
                {markButtons({
                    "left": FormatAlignLeft,
                    "center": FormatAlignCenter,
                    "right": FormatAlignRight,
                    "justify": FormatAlignJustify,
                })}
            </ToggleButtonGroup>

            <ToggleButtonGroup value={toolbarState.current.marks}>
                {markButtons({
                    "bulletList": FormatListBulleted,
                    "orderedList": FormatListNumbered,
                })}
            </ToggleButtonGroup>

            <ToggleButtonGroup value={toolbarState.current.marks}>
                {markButtons({
                    "link": Link,
                    "image": Image
                })}
            </ToggleButtonGroup>

            <input type="file" style="display:none"
                    ref={fileInputRef} 
                    onchange={onFileInputChange}/>
        </Root>
    );
}

const PREFIX = 'FrugalTextInputToolbar';
const classes = {
    root: `${PREFIX}-root`,
};
const Root = styled('div')(({ theme }) => ({
    [`&.${classes.root}`]: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        '& > *': {
            marginRight: theme.spacing(1),
            marginBottom: theme.spacing(1),
        },
        '& > *:last-child': {
            marginRight: 0,
        },
        '& button.MuiToggleButton-sizeSmall': {
            padding: theme.spacing(0.3),
            fontSize: theme.typography.pxToRem(18),
        },
        '& button.MuiToggleButton-sizeMedium': {
            padding: theme.spacing(0.5),
            fontSize: theme.typography.pxToRem(24),
        },
        '& button.MuiToggleButton-sizeLarge': {
            padding: theme.spacing(1),
            fontSize: theme.typography.pxToRem(24),
        },
    },
}));
