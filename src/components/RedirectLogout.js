import {setGlobal} from 'reactn';
import { COGNITO_ENDPOINT, COGNITO_APPID, COGNITO_REDIRECT_LOGOUT } from '../config';

export default function RedirectLogout(props) {
    const { v4: uuidv4 } = require('uuid');
    setGlobal({token: null, nonce: uuidv4()});
    var redirect = encodeURIComponent(COGNITO_REDIRECT_LOGOUT);
    var url = `${COGNITO_ENDPOINT}/logout?client_id=${COGNITO_APPID}&logout_uri=${redirect}`;
    window.location.replace(url);
}
