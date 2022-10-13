import cytoscape from 'cytoscape'
import fcose from 'cytoscape-fcose';
import avsdf from 'cytoscape-avsdf';
import svg from 'cytoscape-svg';

cytoscape.use( svg );
cytoscape.use(fcose)
cytoscape.use(avsdf);

import CytoscapeComponent from 'react-cytoscapejs'
export default CytoscapeComponent