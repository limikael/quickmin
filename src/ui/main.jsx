import {render} from 'preact'
import QuickminAdmin from './QuickminAdmin.jsx'

let el=document.getElementById('app');
render(<QuickminAdmin {...Object.assign({},el.dataset)}/>, el);
