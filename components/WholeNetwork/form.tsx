'use client'
import React, { useEffect, useState } from 'react';
import { useQueryState } from 'next-usequerystate'
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import fileDownload from 'js-file-download'
import { 
    Tooltip, 
    Chip, 
    IconButton, 
    Menu, 
    MenuItem, 
    Slider,
    Grid,
    Typography,
    Autocomplete,
    Stack,
    ListItemText,
    ListItemIcon,
    Checkbox,
    FormControlLabel,
    TextField,
    Divider
 } from '@mui/material';

import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';

import LabelIcon from '@mui/icons-material/Label';
import LabelOffIcon from '@mui/icons-material/LabelOff';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import UndoIcon from '@mui/icons-material/Undo';

import {mdiDna, 
    mdiLinkVariant,
    mdiLinkVariantOff,
    mdiGraph,
    mdiTable,
    mdiTooltip,
    mdiTooltipRemove,
    mdiPlusCircleOutline,
    mdiMinusCircleOutline
} from '@mdi/js';
import Icon from '@mdi/react';

import { router_push } from '@/utils/client_side';
import { NetworkSchema } from '@/app/api/knowledge_graph/route';
import { FilterSchema, process_relation } from '@/utils/helper';
import { process_tables } from '@/utils/helper';
import { layouts } from '../Cytoscape';  


import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

  
  function Form({
    elements = {nodes: [], edges: []},
}: {
    elements: null | NetworkSchema,
}) {
    const pathname = usePathname()
    const router = useRouter()
    const searchParams = useSearchParams()
    const fullscreen = searchParams.get('fullscreen')
    
    const [edge_labels, setEdgeLabels] = useQueryState('edge_labels')
    const [layout, setLayout] = useQueryState('layout')
	const [legend, setLegend] = useQueryState('legend')
	const [legend_size, setLegendSize] = useQueryState('legend_size')
    const [download_image, setDownloadImage] = useQueryState('download_image')

    const [anchorEl, setAnchorEl] = useState<HTMLElement>(null)
    const [anchorElLayout, setAnchorElLayout] = useState<HTMLElement>(null)
    
    const handleClickMenu = (e:React.MouseEvent<HTMLButtonElement, MouseEvent>, setter:Function) => {
		setter(e.currentTarget);
	  };
	const handleCloseMenu = (setter:Function) => {
		setter(null);
	};
    return(
        <Grid container justifyContent="space-around" spacing={1}>
            <Grid item xs={12}>
                <Grid container spacing={1} alignItems="flex-start" justifyContent="flex-start">
                    <Grid item>
                        <Stack direction={"row"} alignItems={"center"} spacing={1}>
                            <Tooltip title={fullscreen ? "Exit full screen": "Full screen"}>
                                <IconButton color="secondary"
                                    onClick={()=>{

                                        const query = {}
                                        if (!fullscreen) query['fullscreen'] = 'true'
                                        router_push(router, pathname, query)
                                    }}
                                >
                                    {fullscreen ? <FullscreenExitIcon/>: <FullscreenIcon/>}
                                </IconButton>
                            </Tooltip>
                            <Divider sx={{backgroundColor: "secondary.main", height: 20, borderRightWidth: 1}} orientation="vertical"/>
                            <Tooltip title={"Save subnetwork"}>
                                <IconButton color="secondary" 
                                    onClick={()=>{
                                        process_tables(elements)
                                    }}
                                    sx={{marginLeft: 5, borderRadius: 5}}
                                >
                                    <SaveIcon/>
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={"Download graph as an image file"}>
                                <IconButton color="secondary"  onClick={(e)=>handleClickMenu(e, setAnchorEl)}
                                    aria-controls={anchorEl!==null ? 'basic-menu' : undefined}
                                    aria-haspopup="true"
                                    aria-expanded={anchorEl!==null ? 'true' : undefined}
                                ><CameraAltOutlinedIcon/></IconButton>
                            </Tooltip>
                            <Menu
                                id="basic-menu"
                                anchorEl={anchorEl}
                                open={anchorEl!==null}
                                onClose={()=>handleCloseMenu(setAnchorEl)}
                                MenuListProps={{
                                    'aria-labelledby': 'basic-button',
                                }}
                            >
                                <MenuItem key={'png'} onClick={()=> {
                                    handleCloseMenu(setAnchorEl)
                                    // fileDownload(cyref.current.png({output: "blob"}), "network.png")
                                    // toPng(document.getElementById('kg-network'))
                                    // .then(function (fileUrl) {
                                    //     download(fileUrl, "network.png");
                                    // });
                                    setDownloadImage('png')
                                }}>PNG</MenuItem>
                                <MenuItem key={'jpg'} onClick={()=> {
                                    handleCloseMenu(setAnchorEl)
                                    // fileDownload(cyref.current.jpg({output: "blob"}), "network.jpg")
                                    // toBlob(document.getElementById('kg-network'))
                                    // .then(function (blob) {
                                    //     fileDownload(blob, "network.jpg");
                                    // });
                                    setDownloadImage('jpg')
                                }}>JPG</MenuItem>
                                <MenuItem key={'svg'} onClick={()=> {
                                    handleCloseMenu(setAnchorEl)
                                    // fileDownload(cyref.current.svg({output: "blob"}), "network.svg")
                                    // toSvg(document.getElementById('kg-network'))
                                    // .then(function (dataUrl) {
                                    //     download(dataUrl, "network.svg")
                                    // });
                                    setDownloadImage('svg')
                                }}>SVG</MenuItem>
                            </Menu>
                            <Divider sx={{backgroundColor: "secondary.main", height: 20, borderRightWidth: 1}} orientation="vertical"/>
                        
                            
                        </Stack>
                        
                    </Grid>
                        <Grid item>
                            <Tooltip title="Switch Graph Layout">
                                <IconButton color="secondary" 
                                    onClick={(e)=>handleClickMenu(e, setAnchorElLayout)}
                                    aria-controls={anchorEl!==null ? 'basic-menu' : undefined}
                                    aria-haspopup="true"
                                    aria-expanded={anchorEl!==null ? 'true' : undefined}
                                >
                                    <FlipCameraAndroidIcon/>
                                </IconButton>
                            </Tooltip>
                            <Menu
                                id="basic-menu"
                                anchorEl={anchorElLayout}
                                open={anchorElLayout!==null}
                                onClose={()=>handleCloseMenu(setAnchorElLayout)}
                                MenuListProps={{
                                    'aria-labelledby': 'basic-button',
                                }}
                            >
                                { Object.entries(layouts).map(([label, {icon}])=>(
                                <MenuItem key={label} onClick={()=> {

                                    // const {...query} = searchParams
                                    // query.layout = label
                                    // router_push(router, pathname, query)
                                    // handleCloseMenu(setAnchorElLayout)
                                    setLayout(label)
                                    
                                }}>
                                    <ListItemIcon>
                                        {icon()}
                                    </ListItemIcon>
                                    <ListItemText>{label}</ListItemText>
                                </MenuItem>
                                ))}
                            </Menu>
                        </Grid>
                        <Grid item>
                            <Tooltip title={edge_labels ? "Hide edge labels": "Show edge labels"}>
                                <IconButton color="secondary"
                                    onClick={()=>{
                                        if (edge_labels) setEdgeLabels(null)
                                        else setEdgeLabels('true')
                                        // router_push(router, pathname, query)
                                        
                                    }}
                                >
                                    {edge_labels ? <VisibilityOffIcon/>: <VisibilityIcon/>}
                                </IconButton>
                            </Tooltip>
                        </Grid>  
                        <Grid item>
                            <Tooltip title={!legend ? "Show legend": "Hide legend"}>
                                <IconButton color="secondary"
                                    onClick={()=>{
                                        if (legend) {
                                            setLegend(null)
                                            setLegendSize(null)
                                        }
                                        else {
                                            setLegend('true')
                                            setLegendSize('0')
                                        }
                                        // const {legend, legend_size, ...query} = searchParams
                                        // if (!legend) query['legend'] = 'true'
                                        // router_push(router, pathname, query)
                                    }}
                                >
                                    {!legend ? <LabelIcon />: <LabelOffIcon />}
                                </IconButton>
                            </Tooltip>
                        </Grid>
                        {legend &&
                            <Grid item>
                                <Tooltip title="Adjust legend size">
                                    <IconButton color="secondary"
                                        onClick={()=>{
                                            setLegendSize(`${(parseInt(legend_size) +1)%5}`)
                                            // const {legend_size='0', ...query} = searchParams
                                            // query['legend_size'] = `${(parseInt(legend_size) +1)%5}`
                                            // router_push(router, pathname, query)
                                        }}
                                    >
                                        {parseInt(legend_size) < 4 ? <ZoomInIcon/>: <ZoomOutIcon/>}
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                        }
                </Grid>
            </Grid>
        </Grid>
    )
}

export default Form