import {styled} from '@mui/material/styles';
import {ToggleButton,ToggleButtonGroup} from '@mui/material';
import { List, ListItem, ListItemText, Menu, MenuItem, Select } from '@mui/material';
import {useEventListener, useForceUpdate} from "../utils/react-util.jsx";
import {useState, useRef} from "react";

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

export function FrugalTextInputToolbar({dispatcher}) {
    let toolbarState=useRef({marks:[], level:"normal"});
    let forceUpdate=useForceUpdate();

    function updateToolbarState() {
        let newState={
            marks: []
        };

        let marks=["bold","italic","strike","code","bulletList","orderedList"];
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
                <ToggleButton key={btn} value={btn} onClick={onToggle}>
                    <Button />
                </ToggleButton>
            );
        });
    }

    return (
        <Root className={classes.root}>
            <Select style={{width: "8em", height: "2.7em", "font-size": "0.8em"}}
                    value={toolbarState.current.level}
                    onChange={onLevelSelect}>
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
