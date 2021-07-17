import React from 'react';
import { withTranslation } from 'react-i18next';
import Button from 'react-bootstrap/Button';
import jwt_decode from "jwt-decode";
import { COGNITO_ENDPOINT, COGNITO_APPID, COGNITO_REDIRECT_LOGIN, COGNITO_REDIRECT_LOGOUT } from '../config';

function LogInButton() {
    const handleLogInClick = (event) => {
        const redirect = encodeURIComponent(COGNITO_REDIRECT_LOGIN);
        const nonce = encodeURIComponent(sessionStorage.getItem('Nonce'));
        const url = `${COGNITO_ENDPOINT}/login?client_id=${COGNITO_APPID}&response_type=token&redirect_uri=${redirect}&state=${nonce}`;
        window.location.href = url;
    }

    return (<Button variant="primary" onClick={handleLogInClick}>{"Log In"}</Button>);
}

// const LogInButton = withTranslation()(LegacyLogInButton);

class LegacyLogOutButton extends React.Component {
    handleClick = (event) => {
        const { v4: uuidv4 } = require('uuid');
        localStorage.removeItem('token');
        sessionStorage.setItem('Nonce', uuidv4());
        var redirect = encodeURIComponent(COGNITO_REDIRECT_LOGOUT);
        var url = `${COGNITO_ENDPOINT}/logout?client_id=${COGNITO_APPID}&logout_uri=${redirect}`;
        window.location.replace(url);
    }

    render() {
        const {t} = this.props;
        return (<Button variant="primary" onClick={this.handleClick}>{t("Log Out")}</Button>);
    }
}
const LogOutButton = withTranslation()(LegacyLogOutButton);

export default () => {
    const token = localStorage.getItem('token');
    if (token === null) {
        return (<LogInButton />);
    } else {
        const decoded_token = jwt_decode(token);
        return (<div>Logged in as: {decoded_token["cognito:username"]}<LogOutButton /></div>);
    }
}
