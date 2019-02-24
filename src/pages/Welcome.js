import React from 'reactn';
import WelcomeBlurb from '../components/WelcomeBlurb';
import MetaTable from '../components/MetaTable';

function MyComponent(props) {
    return (<><WelcomeBlurb /><MetaTable /></>);
}

export default React.memo(MyComponent);