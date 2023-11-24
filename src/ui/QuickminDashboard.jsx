import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import {Button, CardContent, Link, CardActions} from '@mui/material';
import {fetchEx, makeNameFromSymbol} from "../utils/js-util.js";
import {Title} from 'react-admin';

export default function QuickminDashboard({conf, role}) {
    let dashboardItems=[];
    for (let cid in conf.collections) {
        let collection=conf.collections[cid];
        if (collection.readAccess.includes(role)
                && collection.helperText) {
            let link="#/"+collection.id;
            if (collection.type=="singleView")
                link="#/"+collection.id+"/single";

            dashboardItems.push(
                <Grid item xs={12} md={6}>
                    <Paper>
                        <CardContent>
                            <Typography gutterBottom variant="h5" component="div">
                                {makeNameFromSymbol(collection.id)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {collection.helperText}
                            </Typography>
                        </CardContent>
                        <CardActions>
                            {collection.type=="singleView" && <>
                                <Button size="small" href={`#/${collection.id}/single`}>
                                    EDIT
                                </Button>
                            </>}
                            {collection.type!="singleView" && <>
                                <Button size="small" href={`#/${collection.id}`}>
                                    VIEW ALL
                                </Button>
                                <Button size="small" href={`#/${collection.id}/create`}>
                                    CREATE NEW
                                </Button>
                            </>}
                        </CardActions>
                    </Paper>
                </Grid>
            );
        }
    }

    return (<>
        <div style="margin: 1em">
            <Title title="Admin" />
            <Typography variant="h3" gutterBottom>Admin</Typography>

            <Grid container spacing={3}>
                {dashboardItems}
            </Grid>
        </div>
    </>)
}
