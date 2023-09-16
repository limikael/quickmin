import {useInput,useResourceContext} from 'react-admin';
import {styled} from '@mui/material/styles';
import clsx from 'clsx';
import {Labeled, InputHelperText} from 'ra-ui-materialui';
import StarterKit from '@tiptap/starter-kit'
import {FrugalTextInputToolbar} from "./FrugalTextInputToolbar";
import {useState,useMemo} from "react";
import {FormHelperText} from '@mui/material';
import React from 'react'
import {EditorContent, useEditor} from '@tiptap/react'
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'

export const FrugalTextInput = (props) => {
    const {
        className,
        defaultValue = '',
        disabled = false,
        fullWidth,
        helperText,
        label,
        readOnly = false,
        source,
        sx,
        toolbar,
        apiPath,
        httpClient
    } = props;

    const resource = useResourceContext(props);
    const {
        id,
        field,
        isRequired,
        fieldState,
        formState: { isSubmitted },
    } = useInput({ ...props, source, defaultValue });

    return (
        <Root
               className={clsx(
                    'ra-input',
                    `ra-input-${source}`,
                    className,
                    fullWidth ? 'fullWidth' : ''
                )}
                sx={sx}>
            <Labeled
                    isRequired={isRequired}
                    label={label}
                    id={`${id}-label`}
                    color={fieldState?.invalid ? 'error' : undefined}
                    source={source}
                    resource={resource}
                    fullWidth={fullWidth}>
                <FrugalTextInputContent 
                        field={field} 
                        disabled={disabled} 
                        helperText={helperText}
                        apiPath={apiPath}
                        httpClient={httpClient}/>
            </Labeled>
        </Root>
    );
};

function FrugalTextInputContent({field, disabled, helperText, apiPath, httpClient}) {
    let dispatcher=useMemo(()=>new EventTarget(),[]);

    return (<>
        <FrugalTextInputToolbar 
                dispatcher={dispatcher} 
                disabled={disabled} 
                apiPath={apiPath} 
                httpClient={httpClient}/>

        <FrugalTextInputEditor 
                dispatcher={dispatcher} 
                field={field} 
                disabled={disabled}/>

        {helperText &&
            <FormHelperText style="margin-left: 14px">
                <InputHelperText helperText={helperText}/>
            </FormHelperText>
        }
    </>);
}

function FrugalTextInputEditor({dispatcher, field, disabled}) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({}),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Link.configure({
                //openOnClick: false
            }),
            Image.configure({})
        ],
        content: field.value,
        onUpdate({editor}) {
            if (!dispatcher.updateCalled) {
                dispatcher.updateCalled=true;
                field.onChange(editor.getHTML());
            }
        },
        onBlur({editor}) {
            dispatcher.updateCalled=false;
            field.onChange(editor.getHTML());
        },
        onCreate({editor}) {
            dispatcher.editor=editor;
            dispatcher.dispatchEvent(new Event("create"))
        },
        onTransaction({editor}) {
            dispatcher.editor=editor;
            dispatcher.dispatchEvent(new Event("transaction"))
        },
        editable: !disabled
    },[]);

    if (!editor)
        return;

    return (<>
        <EditorContent className={classes.editorContent} editor={editor}/>
    </>)
}

const PREFIX = 'FrugalTextInput';
const classes = {
    editorContent: `${PREFIX}-editorContent`,
};
const Root = styled('div', {
    name: PREFIX,
    overridesResolver: (props, styles) => styles.root,
})(({ theme }) => ({
    '&.fullWidth': {
        width: '100%',
    },
    [`& .${classes.editorContent}`]: {
        width: '100%',
        '& .ProseMirror': {
            backgroundColor: theme.palette.background.default,
            borderColor:
                theme.palette.mode === 'light'
                    ? 'rgba(0, 0, 0, 0.23)'
                    : 'rgba(255, 255, 255, 0.23)',
            borderRadius: theme.shape.borderRadius,
            borderStyle: 'solid',
            borderWidth: '1px',
            padding: theme.spacing(1),

            '&[contenteditable="false"], &[contenteditable="false"]:hover, &[contenteditable="false"]:focus': {
                backgroundColor: theme.palette.action.disabledBackground,
            },

            '&:hover': {
                backgroundColor: theme.palette.action.hover,
            },
            '&:focus': {
                backgroundColor: theme.palette.background.default,
            },
            '& p': {
                margin: '0 0 1em 0',
                '&:last-child': {
                    marginBottom: 0,
                },
            },
        },
    },
}));
