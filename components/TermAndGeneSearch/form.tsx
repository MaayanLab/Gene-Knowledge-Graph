'use client'
import React, { useEffect, useState } from 'react';
import { useQueryState } from 'next-usequerystate'
import { usePathname, useRouter } from 'next/navigation';
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
    edges=[],
    hiddenLinksRelations,
    coexpression_prediction,
    additional_link_button,
    additional_link_relation_tags,
    neighborCount=100,
    genes = [],
    elements = {nodes: [], edges: []},
    searchParams,
    initial_query
}: {
    edges: Array<string>,
    hiddenLinksRelations: Array<string>,
    coexpression_prediction: boolean,
    additional_link_button: boolean,
    neighborCount: number,
    genes: Array<{string}>,
    additional_link_relation_tags?: Array<string>,
    elements: null | NetworkSchema,
    searchParams: {
        filter?: string,
        fullscreen?: 'true',
        view?:string,
        tooltip?: 'true',
        legend?: 'true',
        edge_labels?: 'true',
        legend_size?: string,
        layout?: string,
    },
    initial_query?: {
        start: string,
        start_term: string,
        start_field?: string,
        [key: string]: string
    },
}) {
    const pathname = usePathname()
    const router = useRouter()
    const {
        filter:f,
        view,
        fullscreen
    } = searchParams
    const filter:FilterSchema = f && f !== '{}' ? JSON.parse(f || '{}'): initial_query
    const {
        start,
        end,
        relation:r,
        limit=5,
        gene_links,
        augment,
        additional_link_tags,
    } = filter
    const [edge_labels, setEdgeLabels] = useQueryState('edge_labels')
    const [tooltip, setTooltip] = useQueryState('tooltip')
	const [layout, setLayout] = useQueryState('layout')
	const [legend, setLegend] = useQueryState('legend')
	const [legend_size, setLegendSize] = useQueryState('legend_size')
    const [download_image, setDownloadImage] = useQueryState('download_image')

    const relation = process_relation(r || [])
    const [error, setError] = useState<{error: string} | null>(null)
    const [anchorEl, setAnchorEl] = useState<HTMLElement>(null)
    const [anchorElLayout, setAnchorElLayout] = useState<HTMLElement>(null)
    const [augmentOpen, setAugmentOpen] = useState<boolean>(false)
    const [augmentLimit, setAugmentLimit] = useState<number>(10)
    const [geneLinksOpen, setGeneLinksOpen] = useState<boolean>(false)
    const [geneLinks, setGeneLinks] = useState<Array<string>>([])
    const [additionalLinkTags, setAdditionalLinkTags] = useState<Array<string>>([])

    useEffect(()=>{
        if (gene_links) setGeneLinks(gene_links)
        if (additional_link_tags) setAdditionalLinkTags(additional_link_tags)
        else setAdditionalLinkTags([])
    }, [searchParams.filter])
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
                    {edges.length && 
                        <Grid item xs={12} md={4} lg={5}>
                            <Autocomplete
                                multiple
                                limitTags={2}
                                id="multiple-limit-tags"
                                options={edges}
                                // getOptionLabel={(option)=>option.name}
                                value={relation.map(({name}:{name:string})=>name)}
                                renderInput={(params) => (
                                    <TextField {...params} label="Select Relation" placeholder="Select Relation" />
                                )}
                                renderOption={(props, option, { selected }) => (
                                    <li {...props}>
                                      <Checkbox
                                        icon={icon}
                                        checkedIcon={checkedIcon}
                                        sx={{ marginRight: 8 }}
                                        checked={selected}
                                      />
                                      {option}
                                    </li>
                                  )}
                                sx={{ width: '100%' }}
                                onChange={(e, r)=>{
                                    if (end || (!end && r.length <= 5)) {
                                        const {filter: f, ...rest} = searchParams
                                        let filter = JSON.parse(f || '{}')
                                        if (Object.keys(filter).length === 0) filter = initial_query
                                        filter.relation = r.map((name:string)=>({name, limit: limit || 5}))
                                        const query = {
                                            ...rest,
                                            filter: JSON.stringify(filter)
                                        }
                                        router_push(router, pathname, query)
                                    } else if (!end && relation.length > 5) {
                                        setError({error: "Please include only 5 relationships for single search"})
                                    }
                                }}
                                renderTags={()=>null}
                            />
                        </Grid>
                        }
                    <Grid item xs={12} md={8} lg={7}>
                        <Grid container spacing={1} alignItems="center">
                            {relation.map((value) => (
                                <Grid item key={value.name}>
                                    <Tooltip title={`${value.name}`} key={value.name} placement="top">
                                        <Chip label={value.name}
                                            color="primary"
                                            sx={{padding: 0, borderRadius: "8px"}}
                                            onDelete={()=>{
                                                const {filter: f, ...rest} = searchParams
                                                let filter = JSON.parse(f || '{}')
                                                if (Object.keys(filter).length === 0) filter = initial_query
                                                const rels = []
                                                for (const i of filter.relation || []) {
                                                    if (i.name !== value.name) {
                                                        rels.push(i)
                                                    }
                                                }
                                                filter.relation = rels
                                                const query = {
                                                    ...rest,
                                                    filter: JSON.stringify(filter)
                                                }
                                                router_push(router, pathname, query)                                                    
                                        }}/>
                                    </Tooltip>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>
                    <Grid item>
                        <Stack direction={"row"} alignItems={"center"} spacing={2}>
                            <Typography variant="subtitle2">Size:</Typography>
                            <Icon path={mdiMinusCircleOutline} size={0.8} />
                            <Tooltip title={!end ? 'Set limit per relationship:': 'Limit number of paths:'}>
                                <Slider 
                                    value={limit ? limit: !end ? relation.length === 1? ((elements || {}).edges || []).length: 5: 25}
                                    color="secondary"
                                    valueLabelDisplay='auto'
                                    onChange={(e, nv)=>{
                                        const {filter: f, ...rest} = searchParams
                                        const filter = {
                                            start: initial_query.start,
                                            start_field: initial_query.start_field,
                                            start_term: initial_query.start_term,
                                            ...JSON.parse(f || '{}'),
                                            limit: nv
                                        }
                                        if (filter.relation) filter.relation = relation.map(({name, limit})=>({name, limit: nv}))
                                        const query = {
                                            ...rest,
                                            filter: JSON.stringify(filter)
                                        }
                                        router_push(router, pathname, query)
                                    }}
                                    min={1}
                                    max={!end ? start === "Gene" ? 50: neighborCount : 150}
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
                                    sx={{marginLeft: 5, borderRadius: 5, background: (!view) ? "#e0e0e0": "none"}}
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
                                    sx={{marginLeft: 5, borderRadius: 5, background: view === "table" ? "#e0e0e0": "none"}}
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
                                    sx={{marginLeft: 5, borderRadius: 5}}
                                >
                                    <SaveIcon/>
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={"Download graph as an image file"}>
                                <IconButton color="secondary"  onClick={(e)=>handleClickMenu(e, setAnchorEl)}
                                    disabled={view && view !== "network"}
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
                    <React.Fragment>
                        <Grid item>
                            <Tooltip title={tooltip ? "Hide tooltip": "Show tooltip"}>
                                <IconButton color="secondary"
                                    disabled={view && view !== "network"}
                                    onClick={()=>{
                                        if (tooltip) setTooltip(null)
                                        else setTooltip('true')
                                        
                                    }}
                                >
                                    {tooltip ? <Icon path={mdiTooltipRemove} size={0.8} />: <Icon path={mdiTooltip} size={0.8} />}
                                </IconButton>
                            </Tooltip>
                        </Grid>
                        <Grid item>
                            <Tooltip title="Switch Graph Layout">
                                <IconButton color="secondary" 
                                    disabled={view && view !== "network"}
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
                        </Grid>  
                        { (additional_link_button) &&
                            <Grid item>
                                <Tooltip title={"Additional Links"}>
                                    <IconButton color="secondary"
                                        disabled={view && view !== "network"}
                                        onClick={()=>{
                                            setGeneLinksOpen(!geneLinksOpen)
                                            setAugmentOpen(false)
                                        }}
                                    >
                                        <Icon path={filter.gene_links ? mdiLinkVariantOff: mdiLinkVariant} size={0.8} />
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                            }
                            { (!end && start !== "Gene" && coexpression_prediction) && 
                                <Grid item>
                                    <Tooltip title={filter.augment ? "Reset network": "Augment network using co-expressed genes"}>
                                        <IconButton color="secondary" 
                                            disabled={genes.length > 100}
                                            onClick={()=>{
                                                setGeneLinksOpen(false)
                                                setAugmentOpen(!augmentOpen)
                                            }}
                                            sx={{marginLeft: 5, borderRadius: 5, background: augmentOpen ? "#e0e0e0": "none"}}
                                        >
                                            <Icon path={mdiDna} size={0.8} />
                                        </IconButton>
                                    </Tooltip>
                                </Grid>
                            }
                            <Grid item>
                                <Tooltip title={!legend ? "Show legend": "Hide legend"}>
                                    <IconButton color="secondary"
                                        disabled={view && view !== "network"}
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
                            {(geneLinksOpen) &&
                                <Grid item xs={12}>
                                    <Grid container justifyContent={'flex-start'}>
                                        <Grid item xs={12}>
                                            <Typography variant='subtitle2' sx={{marginRight: 5}}>Select relationships:</Typography>
                                        </Grid>
                                        {additional_link_relation_tags.length > 0 ?
                                            additional_link_relation_tags.map(i=>(
                                                <Grid item key={i} className='flex justify-end'>
                                                    <FormControlLabel control={<Checkbox checked={additionalLinkTags.indexOf(i)>-1} onChange={()=>{
                                                        if (additionalLinkTags.indexOf(i)===-1) setAdditionalLinkTags([...additionalLinkTags, i])
                                                        else setAdditionalLinkTags(additionalLinkTags.filter(l=>l!==i))
                                                    }}/>} label={<Typography variant='subtitle2'>{i}</Typography>} />
                                                </Grid>
                                            )):
                                            hiddenLinksRelations.map(i=>(
                                                <Grid item xs={12} key={i} className='flex justify-end'>
                                                    <FormControlLabel control={<Checkbox checked={geneLinks.indexOf(i)>-1} onChange={()=>{
                                                        if (geneLinks.indexOf(i)===-1) setGeneLinks([...geneLinks, i])
                                                        else setGeneLinks(geneLinks.filter(l=>l!==i))
                                                    }}/>} label={<Typography variant='subtitle2'>{i}</Typography>} />
                                                </Grid>
                                            ))
                                        }
                                        <Grid item xs={12} className='flex' sx={{ml: -1}}>
                                            <Tooltip title="Show gene links">
                                                <IconButton color="secondary" 
                                                    disabled={geneLinks.length ===  0 && additionalLinkTags.length === 0}
                                                    onClick={()=>{

                                                        const {filter: f, ...query} = searchParams
                                                        const filter = {...initial_query, ...JSON.parse(f || '{}')}
                                                        if (geneLinks.length) filter.gene_links = geneLinks
                                                        if (additionalLinkTags.length) filter.additional_link_tags = additionalLinkTags
                                                        query['filter'] = JSON.stringify(filter)
                                                        router_push(router, pathname, query)
                                                    }}
                                                >
                                                    <SendIcon/>
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Reset network">
                                                <IconButton color="secondary"  disabled={!gene_links && !additional_link_tags}
                                                    onClick={()=>{

                                                        const {filter: f, ...query} = searchParams
                                                        const {gene_links, additional_link_tags, ...filter} = JSON.parse(f)
                                                        query['filter'] = JSON.stringify(filter)
                                                        router_push(router, pathname, query)
                                                        setGeneLinks([])
                                                        setGeneLinksOpen(false)
                                                    }}
                                                >
                                                    <UndoIcon/>
                                                </IconButton>
                                            </Tooltip>
                                        </Grid>
                                    </Grid>
                                    {/* <Stack direction="row" alignItems="center" justifyContent={"flex-end"}>
                                        <Typography variant='subtitle2' sx={{marginRight: 5}}>Select relationships:</Typography>
                                        {geneLinksRelations.map(i=>(
                                            <FormControlLabel key={i} control={<Checkbox checked={geneLinks.indexOf(i)>-1} onChange={()=>{
                                                if (geneLinks.indexOf(i)===-1) setGeneLinks([...geneLinks, i])
                                                else setGeneLinks(geneLinks.filter(l=>l!==i))
                                            }}/>} label={<Typography variant='subtitle2'>{i}</Typography>} />
                                        ))}
                                        <Tooltip title="Show gene links">
                                            <IconButton color="secondary" 
                                                disabled={geneLinks.length === 0}
                                                onClick={()=>{

                                                    const {filter: f, ...query} = searchParams
                                                    const filter = {...initial_query, ...JSON.parse(f || '{}')}
                                                    if (geneLinks.length) filter.gene_links = geneLinks
                                                    query['filter'] = JSON.stringify(filter)
                                                    router_push(router, pathname, query)
                                                }}
                                            >
                                                <SendIcon/>
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Reset network">
                                            <IconButton color="secondary"  disabled={!gene_links}
                                                onClick={()=>{

                                                    const {filter: f, ...query} = searchParams
                                                    const {gene_links, ...filter} = JSON.parse(f)
                                                    query['filter'] = filter
                                                    router_push(router, pathname, query)
                                                    setGeneLinks([])
                                                    setGeneLinksOpen(false)
                                                }}
                                            >
                                                <UndoIcon/>
                                            </IconButton>
                                        </Tooltip>
                                    </Stack> */}
                                </Grid>
                            }
                            {(augmentOpen) && 
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
                                            <IconButton color="secondary" 
                                                disabled={genes.length > 100}
                                                onClick={()=>{

                                                    const {filter: f, ...query} = searchParams
                                                    const filter = {...initial_query, ...JSON.parse(f || '{}')}
                                                    filter.augment = true
                                                    filter.augment_limit = augmentLimit || 10
                                                    
                                                    query['filter'] = JSON.stringify(filter)
                                                    router_push(router, pathname, query)
                                                    setAugmentOpen(false)
                                                }}
                                            >
                                                <SendIcon/>
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Reset network">
                                            <IconButton color="secondary"  disabled={!augment}
                                                onClick={()=>{

                                                    const {filter: f, ...query} = searchParams
                                                    const {augment, augment_limit, ...filter} = JSON.parse(f)
                                                    
                                                    query['filter'] = filter
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
                        </React.Fragment>
                </Grid>
            </Grid>
        </Grid>
    )
}

export default Form