import cytoscape from 'cytoscape'
import fcose from 'cytoscape-fcose';
import avsdf from 'cytoscape-avsdf';
import popper from 'cytoscape-popper';

cytoscape.use(fcose)
cytoscape.use(avsdf);
cytoscape.use( popper )

import CytoscapeComponent from 'react-cytoscapejs'
export default CytoscapeComponent