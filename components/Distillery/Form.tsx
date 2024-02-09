'use client'
import React, { useState } from 'react';
import { useQueryState } from 'next-usequerystate'
import { usePathname, useRouter } from 'next/navigation';
import fileDownload from 'js-file-download'
import { 
    Tooltip, 
    IconButton, 
    Menu, 
    MenuItem, 
    Slider,
    Grid,
    Typography,
    Stack,
    ListItemText,
    ListItemIcon,
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
import HubIcon from '@mui/icons-material/Hub';

import {
    mdiFamilyTree,
    mdiDotsCircle,
    mdiGraph,
    mdiTable,
    mdiTooltip,
    mdiTooltipRemove,
    mdiPlusCircleOutline,
    mdiMinusCircleOutline
} from '@mdi/js';
import Icon from '@mdi/react';

import { toPng, toBlob, toSvg } from 'html-to-image';
import download from 'downloadjs'
import { router_push } from '@/utils/client_side';
import { NetworkSchema } from '@/app/api/knowledge_graph/route';
import { process_tables } from '@/utils/helper';
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
  
  function Form({
    elements = {nodes: [], edges: []},
    searchParams
}: {
    elements: null | NetworkSchema,
    searchParams: {
        term?: string,
        field?: string,
        limit?: string,
        fullscreen?:'true',
        view?:string
    },
}) {
    const pathname = usePathname()
    const router = useRouter()

    const {
        limit,
        view,
        fullscreen
    } = searchParams
    const [edge_labels, setEdgeLabels] = useQueryState('edge_labels')
    const [tooltip, setTooltip] = useQueryState('tooltip')
	const [layout, setLayout] = useQueryState('layout')
	const [legend, setLegend] = useQueryState('legend')
	const [legend_size, setLegendSize] = useQueryState('legend_size')

    const [anchorEl, setAnchorEl] = useState<HTMLElement>(null)
    const [anchorElLayout, setAnchorElLayout] = useState<HTMLElement>(null)
    
    
    const handleClickMenu = (e:React.MouseEvent<HTMLButtonElement, MouseEvent>, setter:Function) => {
		setter(e.currentTarget);
	  };
	const handleCloseMenu = (setter:Function) => {
		setter(null);
	};
    return(
        <Grid container spacing={1}>            
			<Grid item>
				<Stack direction={"row"} alignItems={"center"} spacing={2}>
					<Typography variant="subtitle2">Size:</Typography>
					<Icon path={mdiMinusCircleOutline} size={0.8} />
					<Tooltip title={'Set limit per relationship:'}>
						<Slider 
							value={parseInt(limit) || 5}
							color="primary"
							valueLabelDisplay='auto'
							onChange={(e, nv)=>{
								const query = {
									...searchParams,
									limit: `${nv}`
								}
								router_push(router, pathname, query)
							}}
							min={1}
							max={25}
							sx={{width: 150}}
							aria-labelledby="continuous-slider"
						/>
					</Tooltip>
					<Icon path={mdiPlusCircleOutline} size={0.8} />
					{/* <Typography variant="subtitle2">{limit ? limit: !end ? relation.length === 1? ((elements || {}).edges || []).length: 5: 25}</Typography> */}
				</Stack>
			</Grid>
			<Grid item>
				<Stack direction={"row"} alignItems={"center"} spacing={1}>
					<Tooltip title={fullscreen ? "Exit full screen": "Full screen"}>
						<IconButton color="secondary"
							onClick={()=>{

								const {fullscreen, ...rest} = searchParams
								const query = {...rest}
								if (!fullscreen) query['fullscreen'] = 'true'
								router_push(router, pathname, query)
							}}
							sx={{marginLeft: 5}}
						>
							{fullscreen ? <FullscreenExitIcon/>: <FullscreenIcon/>}
						</IconButton>
					</Tooltip>
					<Tooltip title={"Network view"}>
						<IconButton color="secondary" 
							onClick={()=>{

								const {view, ...query} = searchParams
								router_push(router, pathname, query)
							}}
							style={{marginLeft: 5, borderRadius: 5, background: (!view) ? "#e0e0e0": "none"}}
						>
							<Icon path={mdiGraph} size={0.8} />
						</IconButton>
					</Tooltip>
					<Tooltip title={"Table view"}>
						<IconButton color="secondary" 
							onClick={()=>{

								const {view, ...query} = searchParams
								query['view'] = 'table'
								router_push(router, pathname, query)
							}}
							style={{marginLeft: 5, borderRadius: 5, background: view === "table" ? "#e0e0e0": "none"}}
						>
							<Icon path={mdiTable} size={0.8} />
						</IconButton>
					</Tooltip>
					<Divider sx={{backgroundColor: "secondary.main", height: 20, borderRightWidth: 1}} orientation="vertical"/>
					<Tooltip title={"Save subnetwork"}>
						<IconButton color="secondary" 
							onClick={()=>{
								process_tables(elements)
							}}
							style={{marginLeft: 5, borderRadius: 5}}
						>
							<SaveIcon/>
						</IconButton>
					</Tooltip>
					<>
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
								toPng(document.getElementById('kg-network'))
								.then(function (fileUrl) {
									download(fileUrl, "network.png");
								});
							}}>PNG</MenuItem>
							<MenuItem key={'jpg'} onClick={()=> {
								handleCloseMenu(setAnchorEl)
								// fileDownload(cyref.current.jpg({output: "blob"}), "network.jpg")
								toBlob(document.getElementById('kg-network'))
								.then(function (blob) {
									fileDownload(blob, "network.jpg");
								});
							}}>JPG</MenuItem>
							<MenuItem key={'svg'} onClick={()=> {
								handleCloseMenu(setAnchorEl)
								// fileDownload(cyref.current.svg({output: "blob"}), "network.svg")
								toSvg(document.getElementById('kg-network'))
								.then(function (dataUrl) {
									download(dataUrl, "network.svg")
								});
							}}>SVG</MenuItem>
						</Menu>
					</>
					<Divider sx={{backgroundColor: "secondary.main", height: 20, borderRightWidth: 1}} orientation="vertical"/>
				</Stack>
				
			</Grid>
			{(!view) &&
				<React.Fragment>
					<Grid item>
						<Tooltip title={tooltip ? "Hide tooltip": "Show tooltip"}>
							<IconButton color="secondary"
								onClick={()=>{
									if (tooltip) setTooltip(null)
									else setTooltip('true')
									
								}}
								style={{marginLeft: 5}}
							>
								{tooltip ? <Icon path={mdiTooltipRemove} size={0.8} />: <Icon path={mdiTooltip} size={0.8} />}
							</IconButton>
						</Tooltip>
					</Grid>
					<Grid item>
						<Tooltip title="Switch Graph Layout">
							<IconButton color="secondary" 
								onClick={(e)=>handleClickMenu(e, setAnchorElLayout)}
								aria-controls={anchorEl!==null ? 'basic-menu' : undefined}
								aria-haspopup="true"
								aria-expanded={anchorEl!==null ? 'true' : undefined}
								style={{marginLeft: 5}}
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
								style={{marginLeft: 5}}
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
								style={{marginLeft: 5}}
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
									}}
									style={{marginLeft: 5}}
								>
									{parseInt(legend_size) < 4 ? <ZoomInIcon/>: <ZoomOutIcon/>}
								</IconButton>
							</Tooltip>
						</Grid>
					}

				</React.Fragment>
			}
		</Grid>
    )
}

export default Form