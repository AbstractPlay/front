import React from 'reactn';
import { withTranslation } from 'react-i18next';
import Button from 'react-bootstrap/Button';

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
            return (<LogOutButton />);
        }
    }
}
