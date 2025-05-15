import {Stack, CardContent} from '@mui/material';
import {styled} from '@mui/material/styles';
import {useWatch} from 'react-hook-form';

export function SimpleFormView({toolbar, children}) {
	return (<>
        <SimpleFormCardContent>
            <Stack alignItems="flex-start">
                {children}
            </Stack>
        </SimpleFormCardContent>
        {toolbar}
    </>);
}

const SimpleFormCardContent = styled(CardContent, {
    name: "RaSimpleForm",
    overridesResolver: (props, styles) => styles.root,
})(({ theme }) => ({
    [theme.breakpoints.down('sm')]: {
        paddingBottom: '5em',
    },
}));

// undefined => don't watch
// {} => watch everything
// {deps: "a,b"} => watch just a and b
//
// for ref, this is how useWatch works:
// ["hello"] => a record with hello
// [] => an empty record
// undefined => the whole record
export function useDepRecord(depOptions) {
    let watchDeps,watchParams;

    // Skip the watch.
    if (!depOptions) {
        watchParams={name: []};
    }

    // Watch certain fields.
    else if (depOptions.dep) {
        watchDeps=depOptions.dep.split(",").map(s=>s.trim());
        watchParams={name: watchDeps};
    }

    // Watch all fields.
    else {
        watchParams=undefined;
    }

    let record=useWatch(watchParams);
    if (Array.isArray(watchDeps)) {
        record=Object.fromEntries(
            [...Array(watchDeps.length).keys()].map(i=>[watchDeps[i],record[i]])
        )
    }

    return record;
}
