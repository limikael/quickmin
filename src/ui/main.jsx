import { render } from 'preact'
import { App } from './app.jsx'

let el=document.getElementById('app');
render(<App {...Object.assign({},el.dataset)}/>, el);
