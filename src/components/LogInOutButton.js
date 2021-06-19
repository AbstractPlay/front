import React from 'reactn';
import { withTranslation } from 'react-i18next';
import Button from 'react-bootstrap/Button';
import jwt_decode from "jwt-decode";

class LegacyLogInButton extends React.Component {
    handleClick = (event) => {
        window.location.replace("/redirect/login");
    }

    render() {
        const {t} = this.props;
        return (<Button variant="primary" onClick={this.handleClick}>{t("Log In")}</Button>);
    }
}
const LogInButton = withTranslation()(LegacyLogInButton);

class LegacyLogOutButton extends React.Component {
    handleClick = (event) => {
        window.location.replace("/redirect/logout");
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
            var token = jwt_decode(this.global.token);
            return (<div>Logged in as: {token["cognito:username"]}<LogOutButton /></div>);
        }
    }
}
