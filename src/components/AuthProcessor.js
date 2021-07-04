import React, {Suspense} from 'reactn';
import { withTranslation } from 'react-i18next';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Spinner from '../components/Spinner';
import { v4 as uuidv4 } from 'uuid';

class AuthProcessor extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            showModal: false
        };
        this.handleClose = this.handleClose.bind(this);
    }

    static defaultProps = {
        redirect: "/"
    };

    handleClose() {
        this.setState({showModal: false});
        window.location.replace("/")
    }

    componentDidMount() {
        var hash = window.location.hash.substr(1);
        var result = {};
        if ( (hash !== null) && (hash !== undefined) && (hash.length > 0) ) {
            hash.split("&").forEach(function(part) {
                var item = part.split("=");
                result[item[0]] = decodeURIComponent(item[1]);
            });

            if ( ("id_token" in result) && (result.id_token.length > 0) && (this.global.nonce === result.state) ) {
                const redirect = this.global.redirect;
                // Store token
                this.setGlobal({token: result.id_token, nonce: uuidv4(), redirect: "/"});
                // Redirect
                window.location.replace(redirect);
            } else {
                this.setState({ showModal: true });
            }
        } else {
            this.setState({ showModal: true });
        }
    }

    render() {
        // An error will appear here if something went wrong.
        const {t} = this.props;
        return (
            <Suspense fallback={<Spinner />}>
                <Modal show={this.state.showModal} onHide={this.handleClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>{t("Login Error")}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {t("Generic login error message")}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={this.handleClose}>{t("Close button label")}</Button>
                    </Modal.Footer>
                </Modal>
            </Suspense>
        );
    }
}
const Processor = withTranslation()(AuthProcessor);
export default () => {
    return (
        <Suspense fallback={<Spinner />}>
            <Processor />
        </Suspense>
    );
};
