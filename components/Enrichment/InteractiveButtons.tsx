'use client'
import { useRouter, usePathname, useSearchParams} from 'next/navigation';
import { parseAsJson, useQueryState } from 'next-usequerystate';
import React, {useState, useEffect } from 'react';
import { layouts } from '../Cytoscape';
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
import { EnrichmentParams } from '.';
const InteractiveButtons = ({
        hiddenLinksRelations=[], 
        shortId,
        gene_count=0,
        elements,
        children,
        disableLibraryLimit,
        libraries_list,
        parsedParams,
        short_url,
        fullscreen,
        additional_link_button,
        additional_link_relation_tags,
        searchParams
    }: {
        short_url?: string,
        libraries_list?:Array<string>,
        disableLibraryLimit?:boolean,
        hiddenLinksRelations?:Array<string>,
        shortId?: string,
        gene_count?: number,
        elements: NetworkSchema,
        children: ReactElement,
        parsedParams: EnrichmentParams,
        fullscreen?: 'true',
        additional_link_button?: boolean,
        additional_link_relation_tags?: Array<string>,
        searchParams: {
            q?:string,
            fullscreen?: 'true'
            view?: string
        }
    }) => {
    const router = useRouter()
    const pathname = usePathname()
    const [edge_labels, setEdgeLabels] = useQueryState('edge_labels')
    // const [view, setView] = useQueryState('view')
	const [layout, setLayout] = useQueryState('layout')
	const [legend, setLegend] = useQueryState('legend')
    const [tooltip, setTooltip] = useQueryState('tooltip')
	const [legend_size, setLegendSize] = useQueryState('legend_size')
    const [query, setQuery] = useQueryState('query', parseAsJson<EnrichmentParams>().withDefault({}))
    const [download_image, setDownloadImage] = useQueryState('download_image')
    const gene_links = query.gene_links || parsedParams.gene_links
    const [anchorEl, setAnchorEl] = useState<HTMLElement>(null)
    const [anchorElLayout, setAnchorElLayout] = useState<HTMLElement>(null)
    const [geneLinksOpen, setGeneLinksOpen] = useState<boolean>(false)
    const [augmentOpen, setAugmentOpen] = useState<boolean>(false)
    const [openShare, setOpenShare] = useState<boolean>(false)
    const [augmentLimit, setAugmentLimit] = useState<number>(parsedParams.augment_limit||10)
    const [geneLinks, setGeneLinks] = useState<Array<string>>([])
    const [additionalLinkTags, setAdditionalLinkTags] = useState<Array<string>>([])

    useEffect(()=>{
        if (gene_links) setGeneLinks(gene_links)
        else setGeneLinks([])
    }, [parsedParams.gene_links])
    

    const handleClickMenu = (e:any, setter:Function) => {
		setter(e.currentTarget);
	  };
	const handleCloseMenu = (setter:Function) => {
		setter(null);
	};
    const view = (searchParams || {}).view

    return (
        <Grid container>
            <Grid item xs={12}>
                <LibraryPicker 
                    parsedParams={parsedParams}
                    libraries_list={libraries_list}
                    fullWidth={false}
                    disableLibraryLimit={disableLibraryLimit || true}
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
                            sx={{borderRadius: 5, background: (view === "network" || !view) ? "#e0e0e0": "none"}}
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
                                // setView('table')
                            }}
                            sx={{borderRadius: 5, background: (view === "table") ? "#e0e0e0": "none"}}
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
                                // setView('bar')
                            }}
                            sx={{borderRadius: 5, background: view === "bar" ? "#e0e0e0": "none"}}
                        >
                            <Icon path={mdiPoll} rotate={90} size={0.8} />
                        </IconButton>
                    </Tooltip>
                    <Divider sx={{backgroundColor: "secondary.main", height: 20, borderRightWidth: 1}} orientation="vertical"/>
                        
                    <Tooltip title={"Save subnetwork"}>
                        <IconButton
                            disabled={elements===null}
                            onClick={()=>{
                                if (elements) process_tables(elements)
                            }}
                            sx={{borderRadius: 5}}
                        >
                            <SaveIcon/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={tooltip ? "Hide tooltip": "Show tooltip"}>
                        <IconButton
                            disabled={elements===null && (view && view !== "network")}
                            onClick={()=>{
                                if (tooltip) setTooltip(null)
                                else setTooltip('true')
                            }}
                        >
                            <Icon path={tooltip? mdiTooltipRemove: mdiTooltip} size={0.8} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Switch Graph Layout">
                        <IconButton  
                            onClick={(e)=>handleClickMenu(e, setAnchorElLayout)}
                            aria-controls={anchorEl!==null ? 'basic-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={anchorEl!==null ? 'true' : undefined}
                            disabled={view && view !== "network"}
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
                        <IconButton
                            disabled={view && view !== "network"}
                            onClick={()=>{
                                if (edge_labels) setEdgeLabels(null)
                                else setEdgeLabels('true')
                                // router_push(router, pathname, query)
                                
                            }}
                        >
                            {edge_labels ? <VisibilityOffIcon/>: <VisibilityIcon/>}
                        </IconButton>
                    </Tooltip>
                    <Divider sx={{backgroundColor: "secondary.main", height: 20, borderRightWidth: 1}} orientation="vertical"/>
                    <Tooltip title={`Download ${(view === "network" || !view) ? "graph": "bar graph"} as an image file`}>
                        <IconButton onClick={(e)=>handleClickMenu(e, setAnchorEl)}
                            disabled={view === 'table'}
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
                            setDownloadImage('png')
                            // toPng(document.getElementById("kg-network"))
                            // .then(function (fileUrl) {
                            //     download(fileUrl, "network.png");
                            // });
                        }}>PNG</MenuItem>
                        <MenuItem key={'jpg'} onClick={()=> {
                            handleCloseMenu(setAnchorEl)
                            // fileDownload(cyref.current.jpg({output: "blob"}), "network.jpg")
                            setDownloadImage('jpg')
                            // toBlob(document.getElementById("kg-network"))
                            // .then(function (fileUrl) {
                            //     fileDownload(fileUrl, "network.jpg");
                            // });
                        }}>JPG</MenuItem>
                        <MenuItem key={'svg'} onClick={()=> {
                            handleCloseMenu(setAnchorEl)
                            // fileDownload(cyref.current.svg({output: "blob"}), "network.svg")
                            setDownloadImage('svg')
                            // toSvg(document.getElementById("kg-network"))
                            // .then(function (dataUrl) {
                            //     download(dataUrl, "network.svg")
                            // });
                        }}>SVG</MenuItem>
                    </Menu>
                    <Tooltip title={"View in Enrichr"}>
                        <IconButton 
                            disabled={!shortId}
                            target="_blank"
                            rel="noopener noreferrer"
                            href={`https://maayanlab.cloud/Enrichr/enrich?dataset=${shortId}`}
                        >
                            <LinkIcon/>
                        </IconButton>
                    </Tooltip>
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
                                    value={short_url ? short_url: window.location.toString()}
                                    sx={{width: "100%"}}
                                />
                            </Grid>
                            <Grid item xs={1}>
                                <Stack direction={"row"}>
                                    <Tooltip title="Copy Link">
                                        <IconButton onClick={()=>navigator.clipboard.writeText(short_url ? short_url: window.location.toString())}><ContentCopyIcon/></IconButton>
                                    </Tooltip>
                                    <Tooltip title="Close">
                                        <IconButton onClick={()=>setOpenShare(false)}><HighlightOffIcon/></IconButton>
                                    </Tooltip>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Modal>
                    <Tooltip title={fullscreen ? "Exit full screen": "Full screen"}>
                        <IconButton
                            onClick={()=>{
                                if (!fullscreen) {
                                    router_push(router, pathname, {
                                        q: JSON.stringify(parsedParams),
                                        fullscreen: 'true'
                                    })
                                } else {
                                    router_push(router, pathname, {
                                        q: JSON.stringify(parsedParams),
                                    })
                                }
                            }}
                        >
                            {fullscreen ? <FullscreenExitIcon/>: <FullscreenIcon/>}
                        </IconButton>
                    </Tooltip>
                    {additional_link_button && 
                        <Tooltip title={"Additional Links"}>
                            <IconButton 
                                disabled={view && view !== "network"}
                                onClick={()=>{
                                    setGeneLinksOpen(!geneLinksOpen)
                                    setAugmentOpen(false)
                                }}
                            >
                                <Icon path={gene_links ? mdiLinkVariantOff: mdiLinkVariant} size={0.8} />
                            </IconButton>
                        </Tooltip>
                    }
                    <Tooltip title={parsedParams.augment ? "Reset network": "Augment network using co-expressed genes"}>
                        <IconButton
                            disabled={(!parsedParams.augment && gene_count > 100)}
                            onClick={()=>{
                                setGeneLinksOpen(false)
                                setAugmentOpen(!augmentOpen)
                            }}
                            sx={{borderRadius: 5, background: augmentOpen ? "#e0e0e0": "none"}}
                        >
                            <Icon path={mdiDna} size={0.8} />
                        </IconButton>
                    </Tooltip>
                    {children}
                    <Divider sx={{backgroundColor: "secondary.main", height: 20, borderRightWidth: 1}} orientation="vertical"/>
                    <Tooltip title={!legend ? "Show legend": "Hide legend"}>
                        <IconButton
                            disabled={(view && view !== "network")}
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
                    {legend &&
                        <Tooltip title="Adjust legend size">
                            <IconButton
                                onClick={()=>{
                                    setLegendSize(`${(parseInt(legend_size) +1)%5}`)
                                }}
                            >
                                {parseInt(legend_size) < 4 ? <ZoomInIcon/>: <ZoomOutIcon/>}
                            </IconButton>
                        </Tooltip>
                    }
                </Stack>
        </Grid>
        {(elements && geneLinksOpen) &&
            <Grid item xs={12}>
                <Stack direction="row" alignItems="center" justifyContent={"flex-end"}>
                    <Typography variant='subtitle2' sx={{marginRight: 5}}>Select relationships:</Typography>
                    { additional_link_relation_tags ? additional_link_relation_tags.map(i=>(
                        <FormControlLabel key={i} control={<Checkbox checked={geneLinks.indexOf(i)>-1} onChange={()=>{
                            if (additionalLinkTags.indexOf(i)===-1) setAdditionalLinkTags([...geneLinks, i])
                            else setAdditionalLinkTags(additionalLinkTags.filter(l=>l!==i))
                        }}/>} label={<Typography variant='subtitle2'>{i}</Typography>} />
                    )):
                    hiddenLinksRelations.map(i=>(
                        <FormControlLabel key={i} control={<Checkbox checked={geneLinks.indexOf(i)>-1} onChange={()=>{
                            if (geneLinks.indexOf(i)===-1) setGeneLinks([...geneLinks, i])
                            else setGeneLinks(geneLinks.filter(l=>l!==i))
                        }}/>} label={<Typography variant='subtitle2'>{i}</Typography>} />
                    ))}
                    <Tooltip title="Show gene links">
                        <IconButton
                            disabled={geneLinks.length === 0}
                            onClick={()=>{
                                const filter = {...parsedParams}
                                if (additionalLinkTags.length) filter.additional_link_tags = additionalLinkTags
                                if (geneLinks.length) filter.gene_links = geneLinks
                                const query = {q: JSON.stringify(filter)}
                                router_push(router, pathname, query)
                            }}
                        >
                            <SendIcon/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Reset network">
                        <IconButton disabled={!gene_links}
                            onClick={()=>{

                                const {gene_links, additional_link_tags, ...filter} = parsedParams
                                const query = {q: JSON.stringify(filter)}
                                router_push(router, pathname, query)
                                setGeneLinks([])
                                setAdditionalLinkTags([])
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
                        color="secondary"
                        sx={{width: 100}}
                    />
                    <Typography variant='subtitle2'>{augmentLimit}</Typography>
                    <Tooltip title="Augment genes">
                        <IconButton
                            disabled={gene_count > 100}
                            onClick={()=>{
                                const {augment, augment_limit, ...q} = {...parsedParams, ...query}
                                router_push(router, pathname, {
                                    q: JSON.stringify({
                                        ...q,
                                        augment: true,
                                        augment_limit: augmentLimit || 10
                                    })
                                })
                                setAugmentOpen(false)
                            }}
                        >
                            <SendIcon/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Reset network">
                        <IconButton disabled={!parsedParams.augment}
                            onClick={()=>{
                                const {augment, augment_limit, ...q} = {...parsedParams, ...query}
                                router_push(router, pathname, {
                                    q: JSON.stringify(q)
                                })
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