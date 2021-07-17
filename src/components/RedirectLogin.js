import React from 'react';
import { COGNITO_ENDPOINT, COGNITO_APPID, COGNITO_REDIRECT_LOGIN } from '../config';

function RedirectLogin(props) {
    var redirect = encodeURIComponent(COGNITO_REDIRECT_LOGIN);
    var nonce = encodeURIComponent(props.nonce);
    var url = `${COGNITO_ENDPOINT}/login?client_id=${COGNITO_APPID}&response_type=token&redirect_uri=${redirect}&state=${nonce}`;
    window.location.href = url;
}

export default React.memo(RedirectLogin);
