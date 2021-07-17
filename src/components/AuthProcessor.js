import React, { useEffect, useState, Suspense }  from 'react';
import { useHistory } from "react-router-dom";
import { withTranslation } from 'react-i18next';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Spinner from '../components/Spinner';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../pages/Skeleton';

function AuthProcessor (props) {
    const [showModal, setShowModal] = useState(false);

    const handleClose = () => {
        setShowModal(false);
        window.location.replace("/")
    }

    useEffect(() => {
        var hash = window.location.hash.substr(1);
        var result = {};
        if ( (hash !== null) && (hash !== undefined) && (hash.length > 0) ) {
            hash.split("&").forEach(function(part) {
                var item = part.split("=");
                result[item[0]] = decodeURIComponent(item[1]);
            });

            console.log('Nonce = ' + sessionStorage.getItem('Nonce'));
            if ( ("id_token" in result) && (result.id_token.length > 0) && (sessionStorage.getItem('Nonce') === result.state) ) {
                // Store token
                localStorage.setItem('token', result.id_token);
                sessionStorage.setItem('Nonce', uuidv4());
                // Redirect
                window.location.replace("/");
            } else {
                setShowModal(true);
            }
        } else {
            setShowModal(true);
        }
    }, []);

    // An error will appear here if something went wrong.
    const {t} = props;
    return (
        <Suspense fallback={<Spinner />}>
            <Modal show={showModal} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>{t("Login Error")}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {t("Generic login error message")}
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={handleClose}>{t("Close button label")}</Button>
                </Modal.Footer>
            </Modal>
        </Suspense>
    );
}

const Processor = withTranslation()(AuthProcessor);
export default () => {
    return (
        <Suspense fallback={<Spinner />}>
            <Processor />
        </Suspense>
    );
};
