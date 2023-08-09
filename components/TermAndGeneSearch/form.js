import React, { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic'

import Link from 'next/link'
import useAsyncEffect from 'use-async-effect'
import { useRouter } from 'next/router'
import fileDownload from 'js-file-download'
import * as default_schema from '../../public/schema.json'
import { isIFrame } from '../../utils/helper';
import { usePrevious, shouldUpdateId } from '../Enrichment';

import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';

import IconButton from '@mui/material/IconButton'

import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import CloseIcon from '@mui/icons-material/Close';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import LabelIcon from '@mui/icons-material/Label';
import LabelOffIcon from '@mui/icons-material/LabelOff';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import UndoIcon from '@mui/icons-material/Undo';
import FilterListIcon from '@mui/icons-material/FilterList';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Popper from '@mui/material/Popper';

import HubIcon from '@mui/icons-material/Hub';
import { mdiFamilyTree, mdiDotsCircle, mdiDna, mdiLinkVariant, mdiLinkVariantOff } from '@mdi/js';
import Icon from '@mdi/react';

import { toPng, toBlob, toSvg } from 'html-to-image';
import download from 'downloadjs'

const Grid = dynamic(() => import('@mui/material/Grid'));

// const Chip = dynamic(() => import('@mui/material/Chip'));
const Typography = dynamic(() => import('@mui/material/Typography'));
const TextField = dynamic(() => import('@mui/material/TextField'));
const Button = dynamic(() => import('@mui/material/Button'));
const Autocomplete = dynamic(() => import('@mui/material/Autocomplete'));
const CircularProgress = dynamic(() => import('@mui/material/CircularProgress'));
const Backdrop = dynamic(() => import('@mui/material/Backdrop'));
const Stack = dynamic(() => import('@mui/material/Stack'));

const ListItemText = dynamic(() => import('@mui/material/ListItemText'));
const ListItemIcon = dynamic(() => import('@mui/material/ListItemIcon'));

const AddBoxIcon  = dynamic(() => import('@mui/icons-material/AddBox'));
const IndeterminateCheckBoxIcon = dynamic(() => import('@mui/icons-material/IndeterminateCheckBox'));
const TooltipCard = dynamic(async () => (await import('../misc')).TooltipCard);
const Legend = dynamic(async () => (await import('../misc')).Legend);
const Selector = dynamic(async () => (await import('../misc')).Selector);
const Checkbox = dynamic(() => import('@mui/material/Checkbox'));
const FormControlLabel = dynamic(() => import('@mui/material/FormControlLabel'));

export const process_relation = (r='[]') => {
	try {
        if (Array.isArray(r)) return r
		const relations  = JSON.parse(r)
		return relations
	} catch (error) {
		return r.split(",")
	}
}
// support old queries
export const process_filter = (query) => {
    const {
        start,
        start_field,
        start_term,
        end,
        end_field,
        end_term,
        relation,
        limit,
        page,
        filter={},
        ...rest
    } = query
    return {
        filter: JSON.stringify({
            start,
            start_field,
            start_term,
            end,
            end_field,
            end_term,
            relation: process_relation(relation),
            limit,
            ...filter
        }),
        ...rest
    }

}
export const redirect = ({router, page, ...query}) => {
    router.push({
        pathname: `/${page || ''}`,
        query: process_filter(query)
    }, undefined, {shallow: true})
}

export default function Form({
    entries,
    edges=[],
    default_relations,
    nodes,
    schema,
    initial_query={},
    tooltip_viz,
    coexpression_prediction,
    gene_link_button,
    neighborCount=100,
    process_tables,
    layouts,
    genes = [],
    elements = {},
}) {
    const router = useRouter()
    const {
        filter:f,
        page
    } = router.query
    const filter = JSON.parse(f || '{}')
    const {
        start,
        start_field,
        start_term,
        end,
        end_field,
        end_term,
        relation=[],
        limit,
        gene_links,
        augment
    } = filter

    const [error, setError] = useState(null)
    const [anchorEl, setAnchorEl] = React.useState(null)
    const [anchorElLayout, setAnchorElLayout] = React.useState(null)
    const [augmentOpen, setAugmentOpen] = React.useState(false)
    const [augmentLimit, setAugmentLimit] = React.useState(10)
    const [geneLinksOpen, setGeneLinksOpen] = React.useState(false)
    const [geneLinks, setGeneLinks] = React.useState(gene_links || [])
    
    const handleClickMenu = (e, setter) => {
		setter(e.currentTarget);
	  };
	const handleCloseMenu = (setter) => {
		setter(null);
	};
  

    useEffect(()=>{
        const {page, ...query} = router.query
        if (!query.filter || Object.keys(JSON.parse(query.filter)).length === 0) {
            if (initial_query) {
                // if (initial_query.relation) initial_query.relation = process_relation(initial_query.relation)
                redirect({
                    router, 
                    page,
                    ...initial_query
                })
                // router.push({
                //     pathname: `/${page || ''}`,
                //     query: initial_query
                // }, undefined, {shallow: true})
            } else {

                query.filter = {
                    start: Object.keys(entries)[0],
                    start_field: 'label',
                    start_term: entries[query.start][query.start_field][0],
                }
                redirect({
                    router, 
                    page,
                    ...query
                })
            }
        }
    }, [router.query])
    
    const geneLinksRelations = schema.edges.reduce((acc, i)=>{
        if (i.gene_link) return [...acc, ...i.match]
        else return acc
    }, [])
    if (!start) return null
    return(
        <Grid container justifyContent="space-around" spacing={1}>
            <Grid item xs={12}>
                <Grid container spacing={2} justifyContent="flex-start" alignItems="center">
                    <Grid item>
                        <Typography variant="body1"><b>Start with</b></Typography>
                    </Grid>
                    <Grid item>
                        <Selector entries={Object.keys(entries).sort()} value={start} prefix={"Start"} onChange={(e)=>redirect({
                            router,
                            page,
                            filter: {
                                start: e,
                                start_field: "label",
                                start_term: (entries || {})[e].label[0]
                            } 
                        })}/>
                    </Grid>
                    <Grid item>
                        <Selector entries={Object.keys(entries[start])} value={start_field} prefix={"StartField"} onChange={(e)=>{
                            const {page, ...query} = router.query  
                            redirect({
                                router,
                                page,
                                ...query,
                                filter: {
                                    ...JSON.parse(query.filter),
                                    start_field: e, 
                                    start_term: (entries || {})[start][e][0],
                                }
                            })
                            }}
                        />
                    </Grid>
                    <Grid item>
                        <Autocomplete
                            id="my-input" aria-describedby="gene" 
                            freeSolo
                            options={(entries || {})[start][start_field] || []}
                            value={start_term}
                            onChange={(evt, value) => {
                                if (value === null) value = ''
                                if (value !== '') {
                                    const {page, ...rest} = router.query
                                    const filter = {
                                        ...JSON.parse(rest.filter),
                                        start_term: value
                                    }
                                    redirect({
                                        router, 
                                        page,
                                        ...rest,
                                        filter
                                    })
                                    // router.push({
                                    //     pathname: `/${page || ''}`,
                                    //     query
                                    // }, undefined, { shallow: true })
                                }
                            }}
                            style={{ width: 220}}
                            renderInput={(params) => (
                            <TextField {...params} 
                                style={{
                                    width: 220,
                                    height: 50,
                                    borderRadius: 5,
                                    padding: 3
                                }}
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: null,
                                    style: {
                                        fontSize: 12,
                                        height: 45,
                                        width: "100%",
                                        paddingLeft: 5
                                    }
                                }}
                            />
                            )}
                        />
                    </Grid>
                    <Grid item>
                        <Typography variant="body1">Example:</Typography>
                    </Grid>
                    {((nodes[start] || {}).example || []).map((e,i)=>(
                        <React.Fragment key={e}>
                            <Grid item>
                                <Link
                                    href={{
                                        pathname: `/${page || ''}`,
                                        query: {
                                            filter: JSON.stringify({
                                                start,
                                                start_field: "label",
                                                start_term: e,
                                            })
                                        // relation
                                        }
                                    }}
                                    shallow
                                >
                                <Button style={{height: 45}}><Typography variant="body2">{e}</Typography></Button>
                                </Link> 
                            </Grid>
                            { i < (nodes[start] || {}).example.length - 1 && 
                                <Grid item><Typography>/</Typography></Grid>
                            }
                        </React.Fragment>
                    ))}
                    {(!end && !isIFrame()) && 
                        <Grid item>
                            <Button onClick={()=>{
                                const {path_length, ...rest} = router.query
                                const {limit, augment, augment_limit, ...f} = JSON.parse(rest.filter)
                                const filter = {
                                    ...f,
                                    end: start,
                                    end_field: "label"
                                }
                                redirect({
                                    page,
                                    router,
                                    ...rest,
                                    filter
                                })
                            }} startIcon={<AddBoxIcon />}>
                                Find Shortest Paths between Two Nodes
                            </Button>
                        </Grid>
                    }
                </Grid>
            </Grid>
            {end &&
                <Grid item xs={12}>
                    <Grid container spacing={2} justifyContent="flex-start" alignItems="center">
                        <Grid item>
                            <Typography variant="body1"><b>End with</b></Typography>
                        </Grid>
                        <Grid item>
                            <Selector entries={Object.keys(entries).sort()} value={end} prefix={"End"} onChange={(e)=>{
                                redirect({
                                    router,
                                    page,
                                    filter: {
                                        start,
                                        start_field,
                                        start_term,
                                        end: e,
                                        end_field: "label",
                                    }
                                })
                            }}/>
                        </Grid>
                        <Grid item>
                            <Selector entries={Object.keys(entries[end])} value={end_field} prefix={"EndField"} onChange={(e)=>{
                                const {page, limit, ...query} = router.query
                                const filter = {
                                    start,
                                    start_field,
                                    start_term,
                                    end,
                                    end_field: e,
                                }
                                redirect({page, router, ...query, filter})
                            }}/>
                        </Grid>
                        <Grid item>
                            <Autocomplete
                                id="my-input" aria-describedby="end-with"
                                freeSolo 
                                options={(entries || {})[end][end_field] ||[]}
                                getOptionLabel={(option) => option[end_field] ?? option}
                                placeholder="Optional"
                                value={end_term || ''}
                                onChange={(evt, value) => {
                                    if (value === null) value = ''
                                    if (value !== '') {
                                        const {page, ...rest} = router.query
                                        const filter = {
                                            start,
                                            start_field,
                                            start_term,
                                            end,
                                            end_field,
                                            end_term: value,
                                        }
                                        redirect({
                                            router, 
                                            page,
                                            ...rest,
                                            filter
                                        })
                                        // router.push({
                                        //     pathname: `/${page || ''}`,
                                        //     query
                                        // }, undefined, { shallow: true })
                                    }
                                }}
                                style={{ width: 220 }}
                                renderInput={(params) => (
                                <TextField {...params} 
                                    style={{
                                    width: 220,
                                    height: 50,
                                    borderRadius: 5,
                                    padding: 3
                                    }}
                                    InputProps={{
                                    ...params.InputProps,
                                    endAdornment: null,
                                    style: {
                                        fontSize: 12,
                                        height: 45,
                                        width: "100%",
                                        paddingLeft: 5
                                    }
                                    }}
                                />
                                )}
                            />
                        </Grid>
                        <Grid item>
                            <Button onClick={()=>{
                                const { filter: f, ...rest} = router.query
                                const {end, end_term, end_field, limit, ...filter} = JSON.parse(f)
                                redirect({page, router, ...rest, filter})}
                            } startIcon={<IndeterminateCheckBoxIcon />}>
                                Collapse to Focus the Search on a Single Node
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            }
            <Grid item xs={12}>
                <Grid container spacing={1} alignItems="center" justifyContent="flex-start">
                    {edges.length && 
                        <Grid item>
                            <Autocomplete
                                multiple
                                limitTags={2}
                                id="multiple-limit-tags"
                                options={edges}
                                // getOptionLabel={(option) => option.title}
                                value={relation}
                                renderInput={(params) => (
                                    <TextField {...params} label="Select Relation" placeholder="Select Relation" />
                                )}
                                sx={{ width: '350px' }}
                                onChange={(e, relation)=>{
                                    if (end || (!end && relation.length <= 5)) {
                                        const {page, filter: f, ...rest} = router.query
                                        const filter = JSON.parse(f || '{}')
                                        filter.relation = relation
                                        redirect({router, page, filter, ...rest})
                                    } else if (!end && relation.length > 5) {
                                        setError("Please include only 5 relationships for single search")
                                    }
                                }}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Tooltip title={`${option}.${ end === null ? '(Click to change number of edges returned.)' : ''}`} key={option} placement="top">
                                            <Chip label={option} {...getTagProps({ index })}
                                                style={{maxWidth: 100}}
                                                onDelete={()=>{
                                                    const {page, filter:f, ...rest} = router.query
                                                    const filter = JSON.parse(f)
                                                    const rels = []
                                                    for (const i of filter.relation) {
                                                        if (i !== option) {
                                                            rels.push(i)
                                                        }
                                                    }
                                                    filter.relation = rels
                                                    redirect({router, page, filter, ...rest})
                                                    
                                            }}/>
                                        </Tooltip>
                                    ))
                                }
                            />
                        </Grid>
                    }
                    <Grid item>
                        <Stack direction={"row"} alignItems={"center"} spacing={1}>
                            <Typography variant="subtitle2">Size:</Typography>
                            <Tooltip title={!end ? 'Set limit per relationship:': 'Limit number of paths:'}>
                                <Slider 
                                    value={limit ? limit: !end ? relation.length === 1? ((elements || {}).edges || []).length: 5: 25}
                                    color="blues"
                                    onChange={(e, nv)=>{
                                        const {page, filter:f, ...rest} = router.query
                                        const filter = JSON.parse(f)
                                        filter.limit = nv
                                        redirect({page, router, filter, ...rest})
                                    }}
                                    min={1}
                                    max={!end ? start === "Gene" ? parseInt(100/(relation.length || 1)): neighborCount : 150}
                                    sx={{width: 100}}
                                    aria-labelledby="continuous-slider"
                                />
                            </Tooltip>
                            <Typography variant="subtitle2">{limit ? limit: !end ? relation.length === 1? ((elements || {}).edges || []).length: 5: 25}</Typography>
                        </Stack>
                    </Grid>
                    <Grid item>
                        <Tooltip title={router.query.fullscreen ? "Exit full screen": "Full screen"}>
                            <IconButton variant='contained'
                                onClick={()=>{
                                    const {page, fullscreen, filter, ...query} = router.query
                                    if (!fullscreen) query.fullscreen = 'true'
                                    redirect({page, router, filter: JSON.parse(filter), ...query})
                                }}
                                style={{marginLeft: 5}}
                            >
                                {router.query.fullscreen ? <FullscreenExitIcon/>: <FullscreenIcon/>}
                            </IconButton>
                        </Tooltip>
                    </Grid>
                    <Grid item>
                        <Tooltip title={"Network view"}>
                            <IconButton
                                onClick={()=>{
                                    const {page, filter, view, ...query} = router.query
                                    // query.view = 'network'
                                    redirect({page, router, filter: JSON.parse(filter), ...query})
                                }}
                                style={{marginLeft: 5, borderRadius: 5, background: (!router.query.view) ? "#e0e0e0": "none"}}
                            >
                                <span className='mdi mdi-graph'/>
                            </IconButton>
                        </Tooltip>
                    </Grid>
                    <Grid item>
                        <Tooltip title={"Table view"}>
                            <IconButton
                                onClick={()=>{
                                    const {page, filter, ...query} = router.query
                                    query.view = 'table'
                                    redirect({page, router, filter: JSON.parse(filter), ...query})
                                }}
                                style={{marginLeft: 5, borderRadius: 5, background: router.query.view === "table" ? "#e0e0e0": "none"}}
                            >
                                <span className='mdi mdi-table'/>
                            </IconButton>
                        </Tooltip>
                    </Grid>
                    <Grid item>
                        <Tooltip title={"Save subnetwork"}>
                            <IconButton
                                onClick={()=>{
                                    process_tables()
                                }}
                                style={{marginLeft: 5, borderRadius: 5}}
                            >
                                <SaveIcon/>
                            </IconButton>
                        </Tooltip>
                    </Grid>
                    {(!router.query.view) &&
                        <React.Fragment>
                            <Grid item>
                                <Tooltip title={router.query.tooltip ? "Hide tooltip": "Show tooltip"}>
                                    <IconButton variant='contained'
                                        onClick={()=>{
                                            const {page, filter, tooltip, ...query} = router.query
                                            if (!tooltip) query.tooltip = true
                                            redirect({page, router, filter: JSON.parse(filter), ...query})
                                        }}
                                        style={{marginLeft: 5}}
                                    >
                                        {router.query.tooltip ? <span className='mdi mdi-tooltip-remove'/>: <span className='mdi mdi-tooltip'/>}
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                            <Grid item>
                                <Tooltip title="Switch Graph Layout">
                                    <IconButton variant='contained'
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
                                        const {page, filter, ...query} = router.query
                                        query.layout = label
                                        redirect({page, router, filter: JSON.parse(filter), ...query})
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
                                <Tooltip title={router.query.edge_labels ? "Hide edge labels": "Show edge labels"}>
                                    <IconButton variant='contained'
                                        onClick={()=>{
                                            // if (edgeStyle.label) setEdgeStyle({})
                                            // else setEdgeStyle({label: 'data(label)'})
                                            const {page, filter, edge_labels, ...query} = router.query
                                            if (!edge_labels) query.edge_labels = true
                                            redirect({page, router, filter: JSON.parse(filter), ...query})
                                        }}
                                        style={{marginLeft: 5}}
                                    >
                                        {router.query.edge_labels ? <VisibilityOffIcon/>: <VisibilityIcon/>}
                                    </IconButton>
                                </Tooltip>
                            </Grid>  
                            <Grid item>
                                <Tooltip title={"Download graph as an image file"}>
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
                            </Grid>
                            { (gene_link_button) &&
                                <Grid item>
                                    <Tooltip title={"Gene-gene connections"}>
                                        <IconButton variant='contained'
                                            onClick={()=>{
                                                setGeneLinksOpen(!geneLinksOpen)
                                                setAugmentOpen(false)
                                            }}
                                            style={{marginLeft: 5}}
                                        >
                                            <Icon path={filter.gene_links ? mdiLinkVariantOff: mdiLinkVariant} size={0.8} />
                                        </IconButton>
                                    </Tooltip>
                                </Grid>
                            }
                            { (!filter.end && filter.start !== "Gene" && coexpression_prediction) && 
                                <Grid item>
                                    <Tooltip title={filter.augment ? "Reset network": "Augment network using co-expressed genes"}>
                                        <IconButton
                                            disabled={genes.length > 100}
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
                            }
                            <Grid item>
                                <Tooltip title={!router.query.legend ? "Show legend": "Hide legend"}>
                                    <IconButton variant='contained'
                                        onClick={()=>{
                                            const {page, filter, legend, legend_size, ...query} = router.query
                                            if (!legend) query.legend = true
                                            redirect({page, router, filter: JSON.parse(filter), ...query})
                                        }}
                                        style={{marginLeft: 5}}
                                    >
                                        {!router.query.legend ? <LabelIcon />: <LabelOffIcon />}
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                            {router.query.legend &&
                                <Grid item>
                                    <Tooltip title="Adjust legend size">
                                        <IconButton variant='contained'
                                            onClick={()=>{
                                                const {page, filter, legend_size=0, ...query} = router.query
                                                query.legend_size = (parseInt(legend_size) +1)%5
                                                redirect({page, router, filter: JSON.parse(filter), ...query})
                                            }}
                                            style={{marginLeft: 5}}
                                        >
                                            {router.query.legend_size < 4 ? <ZoomInIcon/>: <ZoomOutIcon/>}
                                        </IconButton>
                                    </Tooltip>
                                </Grid>
                            }
                            {(geneLinksOpen) &&
                                <Grid item xs={12}>
                                    <Stack direction="row" alignItems="center" justifyContent={"flex-end"}>
                                        <Typography variant='subtitle2' style={{marginRight: 5}}>Select relationships:</Typography>
                                        {geneLinksRelations.map(i=>(
                                            <FormControlLabel key={i.name} control={<Checkbox checked={geneLinks.indexOf(i)>-1} onChange={()=>{
                                                if (geneLinks.indexOf(i)===-1) setGeneLinks([...geneLinks, i])
                                                else setGeneLinks(geneLinks.filter(l=>l!==i))
                                            }}/>} label={<Typography variant='subtitle2'>{i}</Typography>} />
                                        ))}
                                        <Tooltip title="Show gene links">
                                            <IconButton
                                                disabled={geneLinks.length === 0}
                                                onClick={()=>{
                                                    const {page, filter: f, ...query} = router.query
                                                    const filter = JSON.parse(f)
                                                    if (geneLinks.length) filter.gene_links = geneLinks
                                                    redirect({page, router, filter, ...query})
                                                    setGeneLinksOpen(false)
                                                }}
                                            >
                                                <SendIcon/>
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Reset network">
                                            <IconButton disabled={!gene_links}
                                                onClick={()=>{
                                                    const {page, filter: f, ...query} = router.query
                                                    const {gene_links, ...filter} = JSON.parse(f)
                                                    redirect({page, router, filter, ...query})
                                                    setGeneLinks([])
                                                    setGeneLinksOpen(false)
                                                }}
                                            >
                                                <UndoIcon/>
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </Grid>
                            }
                            {(augmentOpen) && 
                                <Grid item xs={12}>
                                    <Stack direction="row" spacing={2} alignItems="center" justifyContent={"flex-end"}>
                                        <Typography variant='subtitle2'>Top co-expressed genes:</Typography>
                                        <Slider 
                                            value={augmentLimit || 10}
                                            onChange={(e, nv)=>{
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
                                                disabled={genes.length > 100}
                                                onClick={()=>{
                                                    const {filter:f, page, ...query} = router.query
                                                    const filter = JSON.parse(f)
                                                    filter.augment = true
                                                    filter.augment_limit = augmentLimit || 10
                                                    redirect({page, router, filter, ...query})
                                                    setAugmentOpen(false)
                                                }}
                                            >
                                                <SendIcon/>
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Reset network">
                                            <IconButton disabled={!augment}
                                                onClick={()=>{
                                                    const { filter:f, page, ...query} = router.query
                                                    const {augment, augment_limit, ...filter} = JSON.parse(f)
                                                    redirect({page, router, filter, ...query})
                                                    setAugmentOpen(false)
                                                }}
                                            >
                                                <UndoIcon/>
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </Grid>
                            }
                        </React.Fragment>
                    }
                </Grid>
            </Grid>
        </Grid>
    )
}