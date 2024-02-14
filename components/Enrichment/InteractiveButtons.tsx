'use client'
import { useRouter, usePathname} from 'next/navigation';
import { useQueryState } from 'next-usequerystate';
import React, {useState } from 'react';
import { layouts } from '../misc/Cytoscape';
import Tooltip from '@mui/material/Tooltip';
import ShareIcon from '@mui/icons-material/Share';

import IconButton from '@mui/material/IconButton'

import LinkIcon from '@mui/icons-material/Link'
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LabelIcon from '@mui/icons-material/Label';
import LabelOffIcon from '@mui/icons-material/LabelOff';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import SaveIcon from '@mui/icons-material/Save';
import Icon from '@mdi/react';
import { mdiDna, mdiLinkVariant, mdiLinkVariantOff, mdiGraph, mdiTable, mdiPoll, mdiTooltipRemove, mdiTooltip} from '@mdi/js';
import SendIcon from '@mui/icons-material/Send';
import UndoIcon from '@mui/icons-material/Undo';

import { toPng, toBlob, toSvg } from 'html-to-image';
import download from 'downloadjs'
import fileDownload from 'js-file-download';
import {
    Menu,
    MenuItem, 
    Modal, 
    Grid, 
    Stack, 
    Slider,
    Typography,
    ListItemText,
    ListItemIcon,
    TextField,
    Checkbox,
    FormControlLabel,
    Divider,
} from '@mui/material';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import { router_push } from '@/utils/client_side';
// const Grid = dynamic(() => import('@mui/material/Grid'));
import { process_tables } from '../../utils/helper';
import { NetworkSchema } from '@/app/api/knowledge_graph/route';
import { ReactElement } from 'react-markdown/lib/react-markdown';
import LibraryPicker from './LibraryPicker';
const InteractiveButtons = ({
        geneLinksRelations=[], 
        shortId,
        searchParams,
        gene_count=0,
        elements,
        children,
        default_libraries,
        disableLibraryLimit,
        libraries_list
    }: {
        libraries_list?:Array<string>,
        disableLibraryLimit?:boolean,
        default_libraries:Array<{
            library: string,
            term_limit: number
        }>,
        geneLinksRelations?:Array<string>,
        shortId?: string,
        gene_count?: number,
        elements: NetworkSchema,
        children: ReactElement,
        searchParams: {
            libraries?: string,
            userListId?: string,
            term_limit?: number,
            gene_limit?: number,
            min_lib?: number,
            gene_degree?: number,
            term_degree?: number,
            augment?: boolean,
            augment_limit?: number,
            gene_links?: string,
            search?: boolean,
            expand?: string,
            remove?: string,
            view?: string,
            fullscreen?: string
        }
    }) => {
    const router = useRouter()
    const pathname = usePathname()
    const gene_links = searchParams.gene_links
    
    const [edge_labels, setEdgeLabels] = useQueryState('edge_labels')
    const [view, setView] = useQueryState('view')
	const [layout, setLayout] = useQueryState('layout')
	const [legend, setLegend] = useQueryState('legend')
    const [tooltip, setTooltip] = useQueryState('tooltip')
	const [legend_size, setLegendSize] = useQueryState('legend_size')
    
    const [anchorEl, setAnchorEl] = useState<HTMLElement>(null)
    const [anchorElLayout, setAnchorElLayout] = useState<HTMLElement>(null)
    const [geneLinksOpen, setGeneLinksOpen] = useState<boolean>(false)
    const [augmentOpen, setAugmentOpen] = useState<boolean>(false)
    const [openShare, setOpenShare] = useState<boolean>(false)
    const [augmentLimit, setAugmentLimit] = useState<number>(searchParams.augment_limit||10)
    const [geneLinks, setGeneLinks] = useState(JSON.parse(gene_links || '[]'))
    

    const handleClickMenu = (e, setter) => {
		setter(e.currentTarget);
	  };
	const handleCloseMenu = (setter) => {
		setter(null);
	};


    return (
        <Grid container>
            <Grid item xs={12}>
                <LibraryPicker searchParams={searchParams}
                    libraries_list={libraries_list}
                    fullWidth={false}
                    disableLibraryLimit={disableLibraryLimit || true}
                    default_libraries={default_libraries || []}
                />
            </Grid>
            <Grid item xs={12}>
                <Stack direction={"row"} alignItems={"center"}>
                    <Tooltip title={"Network view"}>
                        <IconButton
                            onClick={()=>{
                                const {view, ...query} = searchParams
                                router_push(router, pathname, query)
                            }}
                            style={{marginLeft: 5, borderRadius: 5, background: (searchParams.view === "network" || !searchParams.view) ? "#e0e0e0": "none"}}
                        >
                            <Icon path={mdiGraph} size={0.8} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={"Table view"}>
                        <IconButton
                            onClick={()=>{
                                const {view, ...query} = searchParams
                                query["view"] = 'table'
                                router_push(router, pathname, query)
                            }}
                            style={{marginLeft: 5, borderRadius: 5, background: (searchParams.view === "table") ? "#e0e0e0": "none"}}
                        >
                            <Icon path={mdiTable} size={0.8} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={"Bar view"}>
                        <IconButton
                            onClick={()=>{
                                const {view, ...query} = searchParams
                                query["view"] = 'bar'
                                router_push(router, pathname, query)
                            }}
                            style={{marginLeft: 5, borderRadius: 5, background: searchParams.view === "bar" ? "#e0e0e0": "none"}}
                        >
                            <Icon path={mdiPoll} rotate={90} size={0.8} />
                        </IconButton>
                    </Tooltip>
                    <Divider sx={{backgroundColor: "secondary.main", height: 20, borderRightWidth: 1}} orientation="vertical"/>
                    { (searchParams.view === "network" || !searchParams.view) &&  
                        <>
                            <Tooltip title={"Save subnetwork"}>
                                <IconButton
                                    disabled={elements===null}
                                    onClick={()=>{
                                        if (elements) process_tables(elements)
                                    }}
                                    style={{marginLeft: 5, borderRadius: 5}}
                                >
                                    <SaveIcon/>
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={tooltip ? "Hide tooltip": "Show tooltip"}>
                                <IconButton
                                    disabled={elements===null}
                                    onClick={()=>{
                                        if (tooltip) setTooltip(null)
                                        else setTooltip('true')
                                    }}
                                    style={{marginLeft: 5}}
                                >
                                    <Icon path={tooltip? mdiTooltipRemove: mdiTooltip} size={0.8} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Clear Graph">
                                <IconButton 
                                    disabled={elements===null}
                                    onClick={()=>{
                                        const {userListId, ...rest} = searchParams
                                        router_push(router, pathname, {})
                                    }}
                                    style={{marginLeft: 5}}
                                >
                                    <HighlightOffIcon/>
                                </IconButton>
                            </Tooltip>
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
                                    handleCloseMenu(setAnchorElLayout)
                                    setLayout(label)
                                    
                                }}>
                                    <ListItemIcon>
                                        {icon()}
                                    </ListItemIcon>
                                    <ListItemText>{label}</ListItemText>
                                </MenuItem>
                                ))}
                            </Menu>
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
                            <Divider sx={{backgroundColor: "secondary.main", height: 20, borderRightWidth: 1}} orientation="vertical"/>
                        </>
                    }
                    { (searchParams.view !== "table") &&  
                        <>
                            <Tooltip title={`Download ${(searchParams.view === "network" || !searchParams.view) ? "graph": "bar graph"} as an image file`}>
                                <IconButton onClick={(e)=>handleClickMenu(e, setAnchorEl)}
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
                                    toPng(document.getElementById("kg-network"))
                                    .then(function (fileUrl) {
                                        download(fileUrl, "network.png");
                                    });
                                }}>PNG</MenuItem>
                                <MenuItem key={'jpg'} onClick={()=> {
                                    handleCloseMenu(setAnchorEl)
                                    // fileDownload(cyref.current.jpg({output: "blob"}), "network.jpg")
                                    toBlob(document.getElementById("kg-network"))
                                    .then(function (fileUrl) {
                                        fileDownload(fileUrl, "network.jpg");
                                    });
                                }}>JPG</MenuItem>
                                <MenuItem key={'svg'} onClick={()=> {
                                    handleCloseMenu(setAnchorEl)
                                    // fileDownload(cyref.current.svg({output: "blob"}), "network.svg")
                                    toSvg(document.getElementById("kg-network"))
                                    .then(function (dataUrl) {
                                        download(dataUrl, "network.svg")
                                    });
                                }}>SVG</MenuItem>
                            </Menu>
                        </>
                    }
                    {shortId &&
                        <Tooltip title={"View in Enrichr"}>
                            <IconButton 
                                target="_blank"
                                rel="noopener noreferrer"
                                href={`https://maayanlab.cloud/Enrichr/enrich?dataset=${shortId}`}
                            >
                                <LinkIcon/>
                            </IconButton>
                        </Tooltip>
                    }
                    <Tooltip title={"Share"}>
                        <IconButton onClick={()=>setOpenShare(true)}>
                            <ShareIcon/>
                        </IconButton>
                    </Tooltip>
                    <Modal
                        open={openShare}
                        onClose={()=>{
                            setOpenShare(false)}
                        }
                        aria-labelledby="child-modal-title"
                        aria-describedby="child-modal-description"
                    >
                        <Grid container
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: 800,
                                bgcolor: 'background.paper',
                                border: '1px solid #000',
                                boxShadow: 15,
                                pt: 2,
                                px: 4,
                                pb: 3,
                                }}
                        >
                            <Grid item xs={12}>
                                <Typography variant='h6'><b>Share Link</b></Typography>
                            </Grid>
                            <Grid item xs={11}>
                                <TextField size='small'
                                    value={`${process.env.NEXT_PUBLIC_HOST}${pathname}`}
                                    style={{width: "100%"}}
                                />
                            </Grid>
                            <Grid item xs={1}>
                                <Stack direction={"row"}>
                                    <Tooltip title="Copy Link">
                                        <IconButton onClick={()=>navigator.clipboard.writeText(window.location.toString())}><ContentCopyIcon/></IconButton>
                                    </Tooltip>
                                    <Tooltip title="Close">
                                        <IconButton onClick={()=>setOpenShare(false)}><HighlightOffIcon/></IconButton>
                                    </Tooltip>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Modal>
                    <Tooltip title={searchParams.fullscreen ? "Exit full screen": "Full screen"}>
                        <IconButton
                            onClick={()=>{
                                const {fullscreen, ...rest} = searchParams
                                const query = {...rest}
                                if (!fullscreen) query['fullscreen'] = 'true'
                                router_push(router, pathname, query)
                            }}
                            style={{marginLeft: 5}}
                        >
                            {searchParams.fullscreen ? <FullscreenExitIcon/>: <FullscreenIcon/>}
                        </IconButton>
                    </Tooltip>
                    {(!searchParams.view || searchParams.view === "network") &&
                        <>
                            <Tooltip title={"Gene-gene connections"}>
                                <IconButton 
                                    onClick={()=>{
                                        setGeneLinksOpen(!geneLinksOpen)
                                        setAugmentOpen(false)
                                    }}
                                    style={{marginLeft: 5}}
                                >
                                    <Icon path={searchParams.gene_links ? mdiLinkVariantOff: mdiLinkVariant} size={0.8} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={searchParams.augment ? "Reset network": "Augment network using co-expressed genes"}>
                                <IconButton
                                    disabled={!searchParams.augment && gene_count > 100}
                                    onClick={()=>{
                                        setGeneLinksOpen(false)
                                        setAugmentOpen(!augmentOpen)
                                    }}
                                    style={{marginLeft: 5, borderRadius: 5, background: augmentOpen ? "#e0e0e0": "none"}}
                                >
                                    <Icon path={mdiDna} size={0.8} />
                                </IconButton>
                            </Tooltip>
                        </>
                    }
                    {children}
                    { (view === 'network' || !view) && 
                    <>
                        <Divider sx={{backgroundColor: "secondary.main", height: 20, borderRightWidth: 1}} orientation="vertical"/>
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
                        {legend &&
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
                        }
                    </>
                    }
                </Stack>
        </Grid>
        {(elements && geneLinksOpen) &&
            <Grid item xs={12}>
                <Stack direction="row" alignItems="center" justifyContent={"flex-end"}>
                    <Typography variant='subtitle2' style={{marginRight: 5}}>Select relationships:</Typography>
                    {geneLinksRelations.map(i=>(
                            <FormControlLabel key={i} control={<Checkbox checked={geneLinks.indexOf(i)>-1} onChange={()=>{
                            if (geneLinks.indexOf(i)===-1) setGeneLinks([...geneLinks, i])
                            else setGeneLinks(geneLinks.filter(l=>l!==i))
                            }}/>} label={<Typography variant='subtitle2'>{i}</Typography>} />
                    ))}
                    <Tooltip title="Show gene links">
                        <IconButton
                            onClick={()=>{
                                const {gene_links, ...query} = searchParams
                                router_push(router, pathname, {
                                    ...query,
                                    gene_links: JSON.stringify(geneLinks)
                                })
                                setGeneLinksOpen(false)
                            }}
                        >
                            <SendIcon/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Reset network">
                        <IconButton disabled={!searchParams.gene_links}
                            onClick={()=>{
                                const {gene_links, ...query} = searchParams
                                router_push(router, pathname, query)
                                setGeneLinksOpen(false)
                            }}
                        >
                            <UndoIcon/>
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Grid>   
        }
        {(elements && augmentOpen) && 
            <Grid item xs={12}>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent={"flex-end"}>
                    <Typography variant='subtitle2'>Top co-expressed genes:</Typography>
                    <Slider 
                        value={augmentLimit || 10}
                        onChange={(e, nv:number)=>{
                            setAugmentLimit(nv)
                        }}
                        min={1}
                        max={50}
                        valueLabelDisplay='auto'
                        aria-labelledby="augment-limit-slider"
                        style={{width: 100}}
                    />
                    <Typography variant='subtitle2'>{augmentLimit}</Typography>
                    <Tooltip title="Augment genes">
                        <IconButton
                            disabled={gene_count > 100}
                            onClick={()=>{
                                const {augment, augment_limit, ...query} = searchParams
                                router_push(router, pathname, {
                                    ...query,
                                    augment: true,
                                    augment_limit: augmentLimit || 10
                                })
                                setAugmentOpen(false)
                            }}
                        >
                            <SendIcon/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Reset network">
                        <IconButton disabled={!searchParams.augment}
                            onClick={()=>{
                                const {augment, augment_limit, ...query} = searchParams
                                router_push(router, pathname, query)
                                setAugmentOpen(false)
                            }}
                        >
                            <UndoIcon/>
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Grid>
        }
    </Grid>
    )
}

export default InteractiveButtons