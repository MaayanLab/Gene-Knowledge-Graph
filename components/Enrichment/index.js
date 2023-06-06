import dynamic from 'next/dynamic'
import { useRouter } from 'next/router';
import React, { useEffect, useState, useRef } from 'react';
import { layouts } from '../kg';
import { process_tables } from '../../utils/helper';
import Tooltip from '@mui/material/Tooltip';
import ShareIcon from '@mui/icons-material/Share';

import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'

import LinkIcon from '@mui/icons-material/Link'
import InputIcon from '@mui/icons-material/Input';
import RefreshIcon from '@mui/icons-material/Refresh';
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
import { mdiDna, mdiLinkVariant, mdiLinkVariantOff } from '@mdi/js';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Modal from '@mui/material/Modal';
import Grid from '@mui/material/Grid';

import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Slider from '@mui/material/Slider'
import SendIcon from '@mui/icons-material/Send';
import UndoIcon from '@mui/icons-material/Undo';

import { toPng, toBlob, toSvg } from 'html-to-image';
import download from 'downloadjs'
import fileDownload from 'js-file-download';

// const Grid = dynamic(() => import('@mui/material/Grid'));
const Typography = dynamic(() => import('@mui/material/Typography'));
const Snackbar = dynamic(() => import('@mui/material/Snackbar'));
const ListItemText = dynamic(() => import('@mui/material/ListItemText'));
const ListItemIcon = dynamic(() => import('@mui/material/ListItemIcon'));

const Backdrop = dynamic(() => import('@mui/material/Backdrop'));
const CircularProgress = dynamic(() => import('@mui/material/CircularProgress'));
const TextField = dynamic(() => import('@mui/material/TextField'));
const CardContent = dynamic(() => import('@mui/material/CardContent'));
const Link = dynamic(() => import('@mui/material/Link'));
const Checkbox = dynamic(() => import('@mui/material/Checkbox'));
const FormControlLabel = dynamic(() => import('@mui/material/FormControlLabel'));

const CameraAltOutlinedIcon  = dynamic(() => import('@mui/icons-material/CameraAltOutlined'));

const GeneSetForm = dynamic(() => import('./form'), {ssr: false})
const Cytoscape = dynamic(() => import('../Cytoscape'), { ssr: false })
const TooltipCard = dynamic(async () => (await import('../misc')).TooltipCard);
const Legend = dynamic(async () => (await import('../misc')).Legend);
const TermViz =  dynamic(() => import('./TermViz'))
const Summarizer = dynamic(async () => (await import('./Summarizer')).Summarizer);


export const delay = ms => new Promise(res => setTimeout(res, ms));

// https://blog.logrocket.com/accessing-previous-props-state-react-hooks/
export const usePrevious = (value) => {
    const ref = useRef();
    useEffect(() => {
      ref.current = value; //assign the value of ref to the argument
    },[value]); //this code will run when the value of 'value' changes
    return ref.current; //in the end, return the current ref value.
  }
  
export const shouldUpdateId = (query, prev_query={}) => {
    const {remove: curr_remove, page: curr_page, ...curr} = query
    const {remove: prev_remove, page: prev_page, ...prev} = prev_query
    if (JSON.stringify(curr) !== JSON.stringify(prev)) return true
    else return false
}


const Enrichment = ({default_options, libraries: l, schema, ...props}) => {
    const router = useRouter()
    const {page, ...rest} = router.query
    const [error, setError] = useState(null)
    const [elements, setElements] = useState(null)
    const [node, setNode] = useState(null)
    const [edge, setEdge] = useState(null)
    const [focused, setFocused] = useState(null)
    const [loading, setLoading] = useState(false)
    const [edgeStyle, setEdgeStyle] = useState({})
    const [layout, setLayout] = useState(Object.keys(layouts)[0])
    const [anchorEl, setAnchorEl] = useState(null)
    const [anchorElLayout, setAnchorElLayout] = useState(null)
    const [collapsed, setCollapsed] = useState(null)
    const [shortId, setShortId] = useState(null)
    const [openShare, setOpenShare] = useState(false)
    const [showTooltip, setShowTooltip] = useState(false)
    const [tab, setTab] = useState("network")
    const [query, setQuery] = useState(rest||{})
    const [id, setId] = useState(0)
    const [legendVisibility, setLegendVisibility] = useState(false)
    const [legendSize, setLegendSize] = useState(0)
    const [description, setDescription] = useState('')
    const [augmentOpen, setAugmentOpen] = useState(false)
    const [augmentLimit, setAugmentLimit] = useState(10)
    const [geneLinksOpen, setGeneLinksOpen] = useState(false)
    const [geneLinks, setGeneLinks] = useState(JSON.parse(router.query.gene_links || '[]'))
    const prevQuery = usePrevious(router.query)
    const libraries_list = props.sortLibraries ? l.sort(function(a, b) {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
     }): l

    const {userListId} = router.query
    
    const cyref = useRef(null);
    const tableref = useRef(null);
    const networkref = useRef(null);


    const [controller, setController] = React.useState(null)

    const tooltip_templates_node = {}
    const tooltip_templates_edges = {}
    for (const i of schema.nodes) {
        tooltip_templates_node[i.node] = i.display
    }

    for (const e of schema.edges) {
        for (const i of e.match) {
        tooltip_templates_edges[i] = e.display
        }
    }

    const get_controller = () => {
        if (controller) controller.abort()
        const c = new AbortController()
        setController(c)
        return c
      }
    

    const handleClickMenu = (e, setter) => {
		setter(e.currentTarget);
	  };
	const handleCloseMenu = (setter) => {
		setter(null);
	};

    const handleClickFilter = (e) => {
		setCollapsed(e.currentTarget);
	  };
	const handleCloseFilter = () => {
		setCollapsed(null);
	};
    const fetch_kg = async () => {
        try {
            const controller = get_controller()
            const {
                userListId,
                gene_limit=default_options.gene_limit,
                min_lib=default_options.min_lib,
                gene_degree=default_options.gene_degree,
                term_degree=default_options.term_degree,
                expand,
                remove,
                augment_limit,
                search,
                gene_links
            } = router.query
            const libraries = router.query.libraries ? JSON.parse(router.query.libraries) : (default_options.selected || [])
            if (!search) {
                return
            } else if (libraries.length === 0) {
                setCollapsed(null)
                setElements(null)
            } else {
                setCollapsed(null)
                setLoading(true)
                let counter = 0
                while (counter < 5) {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_PREFIX}/api/knowledge_graph/enrichment${router.query.augment==='true' ? '/augment': ''}`,
                        {
                            method: "POST",
                            body: JSON.stringify({
                                userListId,
                                libraries,
                                min_lib,
                                gene_limit,
                                gene_degree,
                                term_degree,
                                expand: expand,
                                remove: remove,
                                augment_limit,
                                gene_links: JSON.parse(gene_links || '[]')
                            }),
                            signal: controller.signal
                        })
                    if (! res.ok && counter === 4) {
                        setError({message: "Error fetching enrichment. Try again in a while.", type: "fail"})
                    }
                    else if (! res.ok && counter < 4) {
                        setError({message: `Error fetching enrichment. Trying again in ${counter + 5} seconds...`, type: "retry"})
                        await delay((counter + 5)*1000)
                    } 
                    else {
                        const results = (await res.json())
                        setError(null)
                        setLoading(false)
                        setElements(results)
                        if (shouldUpdateId(router.query, prevQuery)) setId(id+1)
                        break
                    }
                    counter = counter + 1
                }
            }
        } catch (error) {
            console.error(error)
        }
    }

    const geneLinksRelations = schema.edges.reduce((acc, i)=>{
        if (i.gene_link) return [...acc, ...i.match]
        else return acc
    }, [])
    useEffect(()=> {
        const get_shortId = async () => {
            let counter = 0
            while (counter < 5) {
                const request = await fetch(`${process.env.NEXT_PUBLIC_ENRICHR_URL}/share?userListId=${userListId}`)
                if (! request.ok && counter === 4) {
                    setError({message: "Error fetching Enrichr Link. Try again in a while.", type: "fail"})
                }
                else if (! request.ok && counter < 4) {
                    setError({message: `Error fetching Enrichr Link. Trying again in ${counter + 5} seconds...`, type: "retry"})
                    await delay((counter + 5)*1000)
                } 
                else {
                    const {link_id} = await request.json()
                    setError(null)
                    setShortId(link_id)
                    break
                }
                counter = counter + 1
            } 
        }
        if (userListId) {
            get_shortId()
        } else {
            setLoading(false)
            setError(null)
        }
        // setCollapsed(userListId!==undefined)
    }, [userListId])

    useEffect(()=>{    
        const {page, ...rest} = router.query
        const userListId = rest.userListId
        const libraries = router.query.libraries ? JSON.parse(router.query.libraries) : (default_options.selected || [])
        setGeneLinks(JSON.parse(router.query.gene_links || '[]'))
        if (userListId) {
            // setLoading(true)
            fetch_kg()
         }
    }, [router.query])

    useEffect(()=>{ 
        const {page, ...rest} = router.query
        setQuery(rest)
        const userListId = rest.userListId
        const libraries = router.query.libraries ? JSON.parse(router.query.libraries) : (default_options.selected || [])
        if (userListId && (error !== null && error.type === "error")) {
            // setLoading(true)
            fetch_kg()
         }
    }, [error])
    const genes = (elements || []).reduce((acc, i)=>{
        if (i.data.kind === "Gene" && acc.indexOf(i.data.label) === -1) return [...acc, i.data.label]
        else return acc
    }, [])
    return (
        <Grid container spacing={2} style={{paddingBottom: 10}} alignItems="center" justifyContent={"space-between"}>
            { (elements !== null && userListId !== undefined) && <Grid item>
                <Tooltip title={collapsed ? "Show filters": "Hide filters"}>
                    <Button onClick={handleClickFilter}
                        startIcon={<InputIcon/>}
                        variant="contained"
                        size="large"
                        color="primary"
                    >
                        Input Gene Set
                    </Button>
                </Tooltip>
                <Menu
                    id="basic-menu"
                    anchorEl={collapsed}
                    open={collapsed!==null}
                    onClose={handleCloseFilter}
                    MenuListProps={{
                        'aria-labelledby': 'basic-button',
                    }}
                >
                    <CardContent style={{width: 1000}}><GeneSetForm setError={setError} setDescription={setDescription} default_options={default_options} loading={loading} setLoading={setLoading} libraries_list={libraries_list.map(l=>l.name)} get_controller={get_controller} disableExample={(elements || []).length > 0} {...props}/></CardContent>
                </Menu>
            </Grid>
            }
            { (elements !== null && userListId !== undefined) && 
                <Grid item>
                    <Grid container direction={"row"} justifyContent="flex-end" alignItems={"center"}>
                    { tab === "network" &&  
                        <React.Fragment>
                            {legendVisibility &&
                                <Grid item>
                                    <Tooltip title="Adjust legend size">
                                        <IconButton variant='contained'
                                            disabled={elements===null}
                                            onClick={()=>{
                                                setLegendSize((legendSize+1)%5)
                                            }}
                                            style={{marginLeft: 5}}
                                        >
                                            {legendSize < 4 ? <ZoomInIcon/>: <ZoomOutIcon/>}
                                        </IconButton>
                                    </Tooltip>
                                </Grid>
                            }
                            <Grid item>
                                <Tooltip title={!legendVisibility ? "Show legend": "Hide legend"}>
                                    <IconButton variant='contained'
                                        disabled={elements===null}
                                        onClick={()=>{
                                            setLegendVisibility(!legendVisibility)
                                        }}
                                        style={{marginLeft: 5}}
                                    >
                                        {!legendVisibility ? <LabelIcon />: <LabelOffIcon />}
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                        </React.Fragment>
                        }
                        <Grid item>
                            <Tooltip title={"Network view"}>
                                <IconButton
                                    disabled={elements===null}
                                    onClick={()=>{
                                        setTab('network')
                                    }}
                                    style={{marginLeft: 5, borderRadius: 5, background: tab === "network" ? "#e0e0e0": "none"}}
                                >
                                    <span className='mdi mdi-graph'/>
                                </IconButton>
                            </Tooltip>
                        </Grid>
                        <Grid item>
                            <Tooltip title={"Table view"}>
                                <IconButton
                                    disabled={elements===null}
                                    onClick={()=>{
                                        setTab('table')
                                    }}
                                    style={{marginLeft: 5, borderRadius: 5, background: tab === "table" ? "#e0e0e0": "none"}}
                                >
                                    <span className='mdi mdi-table'/>
                                </IconButton>
                            </Tooltip>
                        </Grid>
                        <Grid item>
                            <Tooltip title={"Bar view"}>
                                <IconButton
                                    disabled={elements===null}
                                    onClick={()=>{
                                        setTab('bar')
                                    }}
                                    style={{marginLeft: 5, borderRadius: 5, background: tab === "bar" ? "#e0e0e0": "none"}}
                                >
                                    <span className='mdi mdi-poll mdi-rotate-90'/>
                                </IconButton>
                            </Tooltip>
                        </Grid>
                        { tab === "network" &&  
                        <React.Fragment>
                            <Grid item>
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
                            </Grid>
                            <Grid item>
                                <Tooltip title={showTooltip ? "Hide tooltip": "Show tooltip"}>
                                    <IconButton variant='contained'
                                        disabled={elements===null}
                                        onClick={()=>{
                                            setShowTooltip(!showTooltip)
                                        }}
                                        style={{marginLeft: 5}}
                                    >
                                        {showTooltip ? <span className='mdi mdi-tooltip-remove'/>: <span className='mdi mdi-tooltip'/>}
                                    </IconButton>
                                </Tooltip>
                            </Grid> 
                            <Grid item>
                                <Tooltip title="Refresh graph">
                                    <IconButton variant='contained'
                                        disabled={elements===null}
                                        onClick={()=>{
                                            setId(id+1)
                                        }}
                                        style={{marginLeft: 5}}
                                    >
                                        <RefreshIcon/>
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                            <Grid item>
                                <Tooltip title="Clear Graph">
                                    <IconButton variant='contained'
                                        disabled={elements===null}
                                        onClick={()=>{
                                            const {userListId, ...rest} = router.query
                                            console.log(rest)
                                            router.push({
                                                pathname: `/${page || ''}`,
                                                query: rest
                                            }, undefined, { shallow: true })
                                            setElements(null)
                                        }}
                                        style={{marginLeft: 5}}
                                    >
                                        <HighlightOffIcon/>
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                            <Grid item>
                                <Tooltip title="Switch Graph Layout">
                                    <IconButton variant='contained'
                                        disabled={elements===null}
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
                                        <MenuItem key={'png'} onClick={()=> {
                                            setLayout(label)
                                            handleCloseMenu(setAnchorElLayout)
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
                                <Tooltip title={edgeStyle.label ? "Hide edge labels": "Show edge labels"}>
                                    <IconButton variant='contained'
                                        disabled={elements===null}
                                        onClick={()=>{
                                            if (edgeStyle.label) setEdgeStyle({})
                                            else setEdgeStyle({label: 'data(label)'})
                                        }}
                                        style={{marginLeft: 5}}
                                    >
                                        {edgeStyle.label ? <VisibilityOffIcon/>: <VisibilityIcon/>}
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                        </React.Fragment>
                        }
                        {tab !== "table" && <Grid item>
                            <Tooltip title={`Download ${tab === "network" ? "graph": "bar graph"} as an image file`}>
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
                        </Grid>
                        }
                        <Grid item>
                            <Tooltip title={"View in Enrichr"}>
                                <IconButton 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href={`https://maayanlab.cloud/Enrichr/enrich?dataset=${shortId}`}
                                >
                                    <LinkIcon/>
                                </IconButton>
                            </Tooltip>
                        </Grid>
                        <Grid item>
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
                                            value={window.location}
                                            style={{width: "100%"}}
                                        />
                                    </Grid>
                                    <Grid item xs={1}>
                                        <Stack direction={"row"}>
                                            <Tooltip title="Copy Link">
                                                <IconButton onClick={()=>navigator.clipboard.writeText(window.location)}><ContentCopyIcon/></IconButton>
                                            </Tooltip>
                                            <Tooltip title="Close">
                                                <IconButton onClick={()=>setOpenShare(false)}><HighlightOffIcon/></IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Modal>
                        </Grid>
                        <Grid item>
                            <Tooltip title={router.query.fullscreen ? "Exit full screen": "Full screen"}>
                                <IconButton variant='contained'
                                    onClick={()=>{
                                    const {fullscreen=false, ...query} = router.query
                                    if (!fullscreen) query.fullscreen = 'true'
                                    router.push({
                                        pathname: `/${page || ''}`,
                                        query
                                        }, undefined, { shallow: true })
                                    }}
                                    style={{marginLeft: 5}}
                                >
                                    {router.query.fullscreen ? <FullscreenExitIcon/>: <FullscreenIcon/>}
                                </IconButton>
                            </Tooltip>
                        </Grid>
                        { tab === "network" &&  
                        <React.Fragment>
                            <Grid item>
                                <Tooltip title={"Gene-gene connections"}>
                                    <IconButton variant='contained'
                                        onClick={()=>{
                                        setGeneLinksOpen(!geneLinksOpen)
                                        setAugmentOpen(false)
                                        }}
                                        style={{marginLeft: 5}}
                                    >
                                        <Icon path={router.query.gene_links ? mdiLinkVariantOff: mdiLinkVariant} size={0.8} />
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                            <Grid item>
                                <Tooltip title={router.query.augment ? "Reset network": "Augment network using co-expressed genes"}>
                                    <IconButton
                                        disabled={!router.query.augment && genes.length > 100}
                                        onClick={()=>{
                                            setGeneLinksOpen(false)
                                            setAugmentOpen(!augmentOpen)
                                        }}
                                        style={{marginLeft: 5, borderRadius: 5, background: augmentOpen ? "#e0e0e0": "none"}}
                                    >
                                        <Icon path={mdiDna} size={0.8} />
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                        </React.Fragment>
                        }
                        <Grid item>
                            <Summarizer elements={elements} schema={schema} augmented={router.query.augment}/>
                        </Grid>
                    </Grid>
                </Grid>
            }
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
                                    const {gene_links, page, ...query} = router.query
                                    router.push({
                                        pathname: `/${page || ''}`,
                                        query: {
                                            ...query,
                                            gene_links: JSON.stringify(geneLinks)
                                        }
                                    }, undefined, { shallow: true })
                                    setGeneLinksOpen(false)
                                }}
                            >
                                <SendIcon/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Reset network">
                            <IconButton disabled={!router.query.gene_links}
                                onClick={()=>{
                                    const {gene_links, page, ...query} = router.query
                                    router.push({
                                        pathname: `/${page || ''}`,
                                        query
                                    }, undefined, { shallow: true })
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
                            onChange={(e, nv)=>{
                                setAugmentLimit(nv)
                                // router.push({
                                //     pathname: `/${page || ''}`,
                                //     query: {
                                //         ...query,
                                //         augment: 'true',
                                //         augment_limit: nv
                                //     }
                                // }, undefined, { shallow: true })
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
                                disabled={genes.length > 100}
                                onClick={()=>{
                                    const {augment, augment_limit, page, ...query} = router.query
                                    router.push({
                                        pathname: `/${page || ''}`,
                                        query: {
                                            ...query,
                                            augment: 'true',
                                            augment_limit: augmentLimit || 10
                                        }
                                    }, undefined, { shallow: true })
                                    setAugmentOpen(false)
                                }}
                            >
                                <SendIcon/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Reset network">
                            <IconButton disabled={!router.query.augment}
                                onClick={()=>{
                                    const {augment, augment_limit, page, ...query} = router.query
                                    router.push({
                                        pathname: `/${page || ''}`,
                                        query
                                    }, undefined, { shallow: true })
                                    setAugmentOpen(false)
                                }}
                            >
                                <UndoIcon/>
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Grid>
            }
            { (userListId === undefined || elements === null) &&
                <Grid item xs={12} style={{height: "100%"}}>
                    <div align="center">
                        { !props.disableHeader && 
                            <Typography variant="h6" sx={{marginBottom: 3}}>Submit your gene set for enrichment analysis with &nbsp;
                                <Link href={shortId ? `https://maayanlab.cloud/Enrichr/enrich?dataset=${shortId}` : "https://maayanlab.cloud/Enrichr/"} 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{color: "black", textDecoration: "none"}}
                                >
                                    <span style={{fontSize: 30, fontWeight: 500, letterSpacing: '0.1em'}}>En</span><span style={{color: 'red', fontSize: 30, fontWeight: 500, letterSpacing: '0.1em'}}>rich</span><span style={{fontSize: 30, fontWeight: 500, letterSpacing: '0.1em'}}>r</span>
                                </Link>
                            </Typography>
                        }
                        <GeneSetForm setDescription={setDescription} setError={setError} default_options={default_options} loading={loading} setLoading={setLoading} libraries_list={libraries_list.map(l=>l.name)} get_controller={get_controller} disableExample={(elements || []).length > 0} {...props}/>
                    </div>
                </Grid>
            }
            {(description !== '' && elements !== null) && <Grid item xs={12}><Typography variant="h5" align='center'><b>{`${description || ''}${router.query.augment === 'true' ? ' (Augmented)':''}`}</b></Typography></Grid>} 
            {(tab === 'network' && elements!==null) && <Grid ref={networkref} id="kg-network" item xs={12} style={{height: !userListId? "100%": !router.query.search ? "100%": 700, position: "relative"}}>
                <Snackbar open={error!==null}
					anchorOrigin={{ vertical:"bottom", horizontal:"left" }}
					autoHideDuration={4500}
					onClose={()=>{
                        if ((error || {} ).type === "fail") {
                            router.push({
                                pathname: `/${page || ''}`,
                            }, undefined, { shallow: true })
                        } else {
                            setError(null)
                        }
                    }}
				>
                    <Alert 
                        onClose={()=>{
                            if ((error || {} ).type === "fail") {
                                router.push({
                                    pathname: `/${page || ''}`,
                                }, undefined, { shallow: true })
                                setError(null)
                            } else {
                                setError(null)
                            }
                        }}
                        severity={(error || {} ).type === "fail" ? "error": "warning"}
                        sx={{ width: '100%' }} 
                        variant="filled"
                        elevation={6}
                        // action={
                        //     <IconButton size="small" onClick={()=>setError(null)} style={{color: "#FFF"}}>
                        //         <HighlightOffIcon/>
                        //     </IconButton>
                        // }
                    >
                        <Typography>{( error || {}).message || ""}</Typography>
                    </Alert>
                </Snackbar>
                { elements.length === 0 ? (
                <div>No results</div>
                ) : loading ?
                <Backdrop
                    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={loading}
                >
                    <CircularProgress/>
                </Backdrop> 
                :
                    <Cytoscape
                        key={id}
                        wheelSensitivity={0.1}
                        style={{
                        width: '100%',
                        height: '100%',
                        }}
                        stylesheet={[
                        {
                            selector: 'node',
                            style: {
                            'background-color': 'data(color)',
                            'border-color': 'data(borderColor)',
                            'border-width': 'data(borderWidth)',
                            'label': 'data(label)',
                            "text-valign": "center",
                            "text-halign": "center",
                            'width': `mapData(node_type, 0, 1, 70, 150)`,
                            'height': `mapData(node_type, 0, 1, 70, 150)`,
                            }
                        },
                        {
                            selector: 'edge',
                            style: {
                            'curve-style': 'straight',
                            // 'opacity': '0.5',
                            'line-color': 'data(lineColor)',
                            'width': '3',
                            // 'label': 'data(label)',
                            "text-rotation": "autorotate",
                            "text-margin-x": "0px",
                            "text-margin-y": "0px",
                            'font-size': '12px',
                            'target-arrow-shape': `data(directed)`,
                            'target-endpoint': 'outside-to-node',
                            'source-endpoint': 'outside-to-node',
                            'target-arrow-color': 'data(lineColor)',
                            ...edgeStyle
                            }
                        },
                        {
                            selector: 'node.highlight',
                            style: {
                                'border-color': 'gray',
                                'border-width': '2px',
                                'font-weight': 'bold',
                                'font-size': '18px',
                                'width': `mapData(node_type, 0, 1, 90, 170)`,
                                'height': `mapData(node_type, 0, 1, 90, 170)`,
                            }
                        },
                        {
                            selector: 'node.focused',
                            style: {
                                'border-color': 'gray',
                                'border-width': '2px',
                                'font-weight': 'bold',
                                'font-size': '18px',
                                'width': `mapData(node_type, 0, 1, 90, 170)`,
                                'height': `mapData(node_type, 0, 1, 90, 170)`,
                            }
                        },
                        {
                            selector: 'edge.focusedColored',
                            style: {
                                'line-color': '#F8333C',
                                'width': '6'
                            }
                        },
                        {
                            selector: 'node.semitransp',
                            style:{ 'opacity': '0.5' }
                        },
                        {
                            selector: 'node.focusedSemitransp',
                            style:{ 'opacity': '0.5' }
                        },
                        {
                            selector: 'edge.colored',
                            style: {
                                'line-color': '#F8333C',
                                'target-arrow-color': '#F8333C',
                                'width': '6'
                            }
                        },
                        {
                            selector: 'edge.semitransp',
                            style:{ 'opacity': '0.5' }
                        },
                        {
                            selector: 'edge.focusedSemitransp',
                            style:{ 'opacity': '0.5' }
                        }
                        ]}
                        elements={elements}
                        layout={layouts[layout]}
                        cy={(cy) => {
                            cyref.current = cy
                            cy.on('click', 'node', function (evt) {
                            // setAnchorEl(null)
                            const node = evt.target.data()

                            if (focused && node.id === focused.id) {
                                const sel = evt.target;
                                cy.elements().removeClass('focusedSemitransp');
                                sel.removeClass('focused').outgoers().removeClass('focusedColored')
                                sel.incomers().removeClass('focusedColored')
                                setFocused(null)
                            } else{
                                const sel = evt.target;
                                cy.elements().removeClass('focused');
                                cy.elements().removeClass('focusedSemitransp');
                                cy.elements().removeClass('focusedColored');
                                cy.elements().not(sel).addClass('focusedSemitransp');
                                sel.addClass('focused').outgoers().addClass('focusedColored')
                                sel.incomers().addClass('focusedColored')
                                sel.incomers().removeClass('focusedSemitransp')
                                sel.outgoers().removeClass('focusedSemitransp')
                                setEdge(null)
                                setNode(null)
                                setFocused(node)
                                setTimeout(()=>{
                                    const sel = evt.target;
                                    cy.elements().removeClass('focusedSemitransp');
                                    sel.removeClass('focused').outgoers().removeClass('focusedColored')
                                    sel.incomers().removeClass('focusedColored')
                                    setFocused(null)
                                }, 3000)
                            }
                        })

                        cy.nodes().on('mouseover', (evt) => {
                            const n = evt.target.data()
                            const sel = evt.target;
                            cy.elements().not(sel).addClass('semitransp');
                            sel.addClass('highlight').outgoers().addClass('colored')
                            sel.incomers().addClass('colored')
                            sel.incomers().removeClass('semitransp')
                            sel.outgoers().removeClass('semitransp')
                            if (focused === null &&  n.id !== (node || {}).id) {
                                setEdge(null)
                                setNode(n)
                            }
                        });

                        cy.nodes().on('mouseout', (evt) => {
                            const sel = evt.target;
                            cy.elements().removeClass('semitransp');
                            sel.removeClass('highlight').outgoers().removeClass('colored')
                            sel.incomers().removeClass('colored')
                            // setAnchorEl(null)
                            // setNode({node: null})
                            setNode(null)
                        });
                        cy.edges().on('mouseover', (evt) => {
                            const e = evt.target.data()
                            const sel = evt.target;
                            cy.elements().not(sel).addClass('semitransp');
                            sel.addClass('colored').connectedNodes().addClass('highlight')
                            sel.connectedNodes().removeClass('semitransp')
                            if (focused === null && e.id !== (edge || {}).id) {
                                // setAnchorEl(evt.target.popperRef())
                                // setNode({node: n})
                                setNode(null)
                                setEdge(e)
                            }
                        });
                        cy.edges().on('mouseout', (evt) => {
                            const sel = evt.target;
                            cy.elements().removeClass('semitransp');
                            sel.removeClass('colored').connectedNodes().removeClass('highlight')
                            // setAnchorEl(null)
                            // setNode({node: null})
                            setEdge(null)
                        });
                    }}
                    />
                }
                {(elements && userListId && legendVisibility) && <Legend elements={elements.sort((a,b)=>((a.data.properties.pval || 1)-(b.data.properties.pval || 1)))} search={false} top={'45%'} left={'20%'} legendSize={legendSize}/>}
                {(focused === null && showTooltip && node) && <TooltipCard 
                    node={node}
                    schema={schema}
                    tooltip_templates={ tooltip_templates_node}
                    setFocused={setFocused}
                    router={router}
                    endpoint={`/${page || ''}`}
                    expand={false}
                    reset={()=>{
                    setEdge(null)
                    setNode(null)
                    setFocused(null)
                    }}
                    />
                }
                {(showTooltip && focused) && <TooltipCard 
                    node={focused}
                    schema={schema}
                    tooltip_templates={ tooltip_templates_node}
                    setFocused={setFocused}
                    router={router}
                    endpoint={`/${page || ''}`}
                    expand={false}
                    reset={()=>{
                    setEdge(null)
                    setNode(null)
                    setFocused(null)
                    }}
                    />
                }
                {(focused === null && showTooltip && edge) && <TooltipCard 
                    node={edge}
                    schema={schema}
                    tooltip_templates={tooltip_templates_edges}
                    setFocused={setFocused}
                    router={router}
                    endpoint={`/${page || ''}`}
                    expand={false}
                    reset={()=>{
                    setEdge(null)
                    setNode(null)
                    setFocused(null)
                    }}
                    />
                }
            </Grid>}
            {(userListId && tab!=='network' && elements !== null) &&
                <Grid item xs={12}>
                    <div ref={tableref}>
                        <TermViz data={elements} schema={schema} tab={tab} setTab={setTab}/>
                    </div>
                </Grid>}
        </Grid>
    )
}

export default Enrichment