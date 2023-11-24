import {Login, LoginForm} from "react-admin";
import {useMemo, useState, useCallback} from "react";
import {Button, CardContent, Link, CardActions} from '@mui/material';

export default function QuickminLogin({conf}) {
    let [showUserPass,setShowUserPass]=useState(false);
    function onShowUserPassClick(ev) {
        ev.preventDefault();
        setShowUserPass(true);
    }

    function onLoginClick(url) {
        window.location=url;
    }

    if (!Object.keys(conf.authUrls).length)
        showUserPass=true;

    //console.log(conf.authUrls);

    return (<>
        <Login>
            {showUserPass && <LoginForm />}
            {!!Object.keys(conf.authUrls).length &&
                <CardContent>
                    {Object.keys(conf.authUrls).map(k=>
                        <Button
                            style="margin-top: 16px"
                            variant="contained"
                            type="submit"
                            color="primary"
                            disabled={false}
                            fullWidth
                            onclick={onLoginClick.bind(null,conf.authUrls[k])}
                        >Login with {k}
                        </Button>
                    )}
                    {!showUserPass &&
                        <Link style="display: block; margin-top: 16px; opacity: 0.5"
                                href="#" 
                                align="center"
                                variant="contained"
                                onclick={onShowUserPassClick}>
                            Login with username/password
                        </Link>
                    }
                </CardContent>
            }
        </Login>
    </>)
}
