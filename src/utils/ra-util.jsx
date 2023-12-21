import {Stack, CardContent} from '@mui/material';
import {styled} from '@mui/material/styles';

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
