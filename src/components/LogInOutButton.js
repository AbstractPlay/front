import React from 'reactn';
import { withTranslation } from 'react-i18next';
import Button from 'react-bootstrap/Button';
import { COGNITO_ENDPOINT, COGNITO_APPID, COGNITO_REDIRECT_LOGIN, COGNITO_REDIRECT_LOGOUT } from '../config';

class LegacyLogInButton extends React.Component {
    handleClick = (event) => {
        var redirect = encodeURIComponent(COGNITO_REDIRECT_LOGIN);
        var nonce = encodeURIComponent(this.global.nonce);
        var url = `${COGNITO_ENDPOINT}/login?client_id=${COGNITO_APPID}&response_type=token&redirect_uri=${redirect}&state=${nonce}`;
        window.location.href = url;
    }

    render() {
        const {t} = this.props;
        return (<Button variant="primary" onClick={this.handleClick}>{t("Log In")}</Button>);
    }
}
const LogInButton = withTranslation()(LegacyLogInButton);

class LegacyLogOutButton extends React.Component {
    handleClick = (event) => {
        const uuidv4 = require('uuid/v4');
        this.setGlobal({token: null, nonce: uuidv4()});
        var redirect = encodeURIComponent(COGNITO_REDIRECT_LOGOUT);
        var url = `${COGNITO_ENDPOINT}/logout?client_id=${COGNITO_APPID}&logout_uri=${redirect}`;
        window.location.href = url;
    }

    render() {
        const {t} = this.props;
        return (<Button variant="primary" onClick={this.handleClick}>{t("Log Out")}</Button>);
    }
}
const LogOutButton = withTranslation()(LegacyLogOutButton);

export default class LogInOutButton extends React.Component {
    render() {
        if (this.global.token === null) {
            return (<LogInButton />);
        } else {
            return (<LogOutButton />);
        }
    }
}
