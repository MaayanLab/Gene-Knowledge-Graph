import dynamic from "next/dynamic";
import HubIcon from '@mui/icons-material/Hub';
import { mdiFamilyTree, mdiDotsCircle, mdiDna, mdiLinkVariant, mdiLinkVariantOff } from '@mdi/js';
import Icon from '@mdi/react';

const Form = dynamic(() => import('./form'));


export const layouts = {
    "Force-directed": {
      name: 'fcose',
      quality: 'proof',
      randomize: 'false',
      animate: true,
      idealEdgeLength: edge => 150,
      icon: ()=><HubIcon/>
    },
    "Hierarchical Layout": {
      name: "breadthfirst",
      animate: true,
      spacingFactor: 1,
      padding: 15,
      avoidOverlap: true,
      icon: ()=><Icon path={mdiFamilyTree} size={0.8} />
    },
    Geometric: {
      name: 'avsdf',
      nodeSeparation: 150,
      icon: ()=><Icon path={mdiDotsCircle} size={0.8} />
    },
  }
  


export default function TermAndGeneSearch(props){
    return (
        <Form {...props} layouts={layouts}/>
    )
} 