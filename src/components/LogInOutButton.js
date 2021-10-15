import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Button from 'react-bootstrap/Button';
import { Auth } from 'aws-amplify';
import { useAuth } from '../pages/Skeleton';

function LogInOutButton(props) {
    // const [token, tokenSetter] = useState(null);
    // const auth = useAuth();
    const { t } = useTranslation();
    // const token = auth.token;

    if (props.token === null) {
        return (<Button onClick={() => Auth.federatedSignIn()}>{t('LogIn')}</Button>);
    } else {
        return (
            <div>
                <Button onClick={() => Auth.signOut()}>{t('LogOut')}</Button>
            </div>);
    }
}

export default LogInOutButton;
