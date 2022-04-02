import React from 'react';
import { useTranslation } from 'react-i18next';
import { Auth } from 'aws-amplify';

function LogInOutButton(props) {
    const { t } = useTranslation();

    if (props.token === null) {
        return (<button className="apButton" onClick={() => Auth.federatedSignIn()} id="login-button" >{t('LogIn')}</button>);
    } else {
        return (
            <div>
                <button className="apButton" onClick={() => Auth.signOut()} id="logout-button">{t('LogOut')}</button>
            </div>);
    }
}

export default LogInOutButton;
