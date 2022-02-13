import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from 'react-bootstrap/Button';
import { Auth } from 'aws-amplify';

function LogInOutButton(props) {
    const { t } = useTranslation();

    if (props.token === null) {
        return (<Button onClick={() => Auth.federatedSignIn()} id="login-button" >{t('LogIn')}</Button>);
    } else {
        return (
            <div>
                <Button onClick={() => Auth.signOut()} id="logout-button">{t('LogOut')}</Button>
            </div>);
    }
}

export default LogInOutButton;
