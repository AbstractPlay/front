import React from 'reactn';
import { useTranslation } from 'react-i18next';

function MyComponent(props) {
    const { t } = useTranslation();
    return (<div>{t("Welcome")}</div>);
}

export default React.memo(MyComponent);