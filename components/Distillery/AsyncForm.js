import React, {useState, useEffect} from "react";
import dynamic from "next/dynamic";
import { withRouter } from "next/router";
import { layouts } from "../kg";

import Tooltip from "@mui/material/Tooltip";
import IconButton from '@mui/material/IconButton'
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import SaveIcon from '@mui/icons-material/Save';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import LabelIcon from '@mui/icons-material/Label';
import LabelOffIcon from '@mui/icons-material/LabelOff';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

import { process_tables } from "../../utils/helper";
import { toPng, toBlob, toSvg } from 'html-to-image';
import download from 'downloadjs'
import fileDownload from 'js-file-download'

const Grid = dynamic(() => import('@mui/material/Grid'));

const Autocomplete = dynamic(() => import('@mui/material/Autocomplete'));
const Typography = dynamic(() => import('@mui/material/Typography'));
const TextField = dynamic(() => import('@mui/material/TextField'));
const CircularProgress = dynamic(() => import('@mui/material/CircularProgress'));
const Checkbox = dynamic(() => import('@mui/material/Checkbox'));
const FormControlLabel = dynamic(() => import('@mui/material/FormControlLabel'));
const Stack = dynamic(() => import('@mui/material/Stack'));
const Slider = dynamic(() => import('@mui/material/Slider'), {ssr: false});

const Selector = dynamic(async () => (await import('../misc')).Selector);
const ListItemIcon = dynamic(() => import('@mui/material/ListItemIcon'));
const ListItemText = dynamic(() => import('@mui/material/ListItemText'));

const AsyncForm = ({ router, 
    default_term, 
    checkbox_filter,
    filter_text,
    type,
    fields,
    options_endpoint,
    selected,
    setSelected
}) => {
    const [options, setOptions] = useState({})
    const [term, setTerm] = useState(router.query.term || default_term)
    const [filter, setFilter] = useState(checkbox_filter)
    const [open, setOpen] = useState(false)
    const [controller, setController] = useState(null)
    const [loading, setLoading] = useState(true)
    const [anchorEl, setAnchorEl] = React.useState(null)
    const [anchorElLayout, setAnchorElLayout] = React.useState(null)

    const {
        field='label',
        limit,
        fullscreen,
        view,
        tooltip,
        edge_labels,
        legend,
        legend_size,
    } = router.query

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

    const resolve_options = async () => {
        try {
            const controller = get_controller()
            const {limit} = router.query 
            const query = {
                field,
            }
            query.type = type
            if (filter) query.filter=JSON.stringify(filter)
            if (term) query.term = term
            if (limit) query.limit = limit
            setTerm(term)
            const query_str = Object.entries(query).map(([k,v])=>(`${k}=${v}`)).join("&")
            const options = await (await fetch(`${process.env.NEXT_PUBLIC_PREFIX}${options_endpoint}${query_str ? "?" + query_str : ""}`, {
                method: 'GET',
                signal: controller.signal
            })).json()  
            setSelected(options[term])
            setOptions(options)  
        } catch (error) {
        } finally {
            setLoading(false)
        }
    }

    useEffect(()=>{
        setTerm(default_term)
        setFilter(checkbox_filter)
    },[router.query.page, router.query.group_page])

    useEffect(()=>{
        setTerm(router.query.term)
    }, [router.query.term])

    useEffect(()=>{
        setLoading(true)
        resolve_options()
    }, [term, filter])

    useEffect(()=>{
        const opts = {}
        for (const i of Object.values(options)) {
            opts[i[field]] = i
        }   
        setOptions(opts)
        if (selected) {        
            setTerm(selected[field])
            router.push({
                pathname: `/${router.query.page}/${router.query.group_page}`,
                query: {
                    term: selected[field],
                    field
                }
            }, undefined, {shallow: true})
        }
    }, [field])

    return (
        <Grid container alignItems={"center"}>
            <Grid item xs={12}>
                <Stack direction={"row"} spacing={1} alignItems={"center"}>
                    <Typography><b>Select {type}:</b></Typography>
                    <Autocomplete
                        sx={{ width: 300 }}
                        value={term}
                        open={open}
                        onOpen={() => {
                            setOpen(true);
                        }}
                        onClose={() => {
                            setOpen(false);
                        }}
                        options={Object.keys(options)}
                        loading={loading}
                        filterOptions={(x) => x}
                        onChange={(e, value)=> {
                            const {term, page, group_page, ...query} = router.query
                            if (!value) {
                                setTerm('')
                            }
                            else {
                                setTerm(value)
                                router.push({
                                    pathname: `/${page}/${group_page}`,
                                    query: {...query, term: value}
                                }, undefined, {shallow: true})
                            }
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                onChange={(e)=> {
                                    {
                                        setTerm(e.target.value)
                                    }
                                }}
                                style={{
                                    height: 50,
                                    borderRadius: 5,
                                    padding: 3
                                }}
                                InputProps={{
                                    ...params.InputProps,
                                    style: {
                                        fontSize: 12,
                                        height: 45,
                                        fontSize: 16, 
                                        width: "100%",
                                        paddingLeft: 5,
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center",
                                        alignContent: "flex-start"
                                    },
                                    endAdornment: (
                                    <React.Fragment>
                                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </React.Fragment>
                                    ),
                                }}
                                inputProps={{
                                    ...params.inputProps,
                                    style: {width: "100%"}
                                }}
                            />
                        )}
                    />
                    {checkbox_filter && <FormControlLabel control={<Checkbox checked={filter!==null} onClick={()=>{
                        if (filter) setFilter(null)
                        else setFilter(checkbox_filter)
                    }}/>} label={filter_text} />}
                    <Typography><b>Select Field:</b></Typography>
                    <Selector entries={fields} 
                        value={field ||"label"} 
                        prefix={"Field"} onChange={(e)=>{
                            const {field="label", page='', group_page='', ...query} = router.query
                            router.push({
                                pathname: `/${page}/${group_page}`,
                                query: {
                                    ...query,
                                    field: e
                                }
                            }, undefined, {shallow: true})
                        }}/>
                    <Typography><b>Limit per relation:</b></Typography>
                    <Slider 
                        value={limit || 5}
                        color="secondary"
                        onChange={(e, nv)=>{
                            const {limit, page='', group_page, ...query} = router.query
                            query.limit = nv || 5
                            router.push({
                                pathname: `/${page}/${group_page}`,
                                query
                            }, undefined, {shallow: true})
                        }}
                        min={1}
                        max={25}
                        sx={{width: 100}}
                        aria-labelledby="continuous-slider"
                    />
                    <Typography>{limit || 5}</Typography>
                </Stack>
            </Grid>
            <Grid item xs={12} sx={{marginTop: 1}}>
                <Stack direction={"row"} spacing={1} alignItems={"center"} justifyContent={"flex-end"}>
                    <Tooltip title={fullscreen ? "Exit full screen": "Full screen"}>
                        <IconButton variant='contained'
                            onClick={()=>{
                                const {fullscreen, page='', group_page, ...query} = router.query
                                if (!fullscreen) query.fullscreen = 'true'
                                router.push({
                                    pathname: `/${page}/${group_page}`,
                                    query
                                }, undefined, {shallow: true})
                            }}
                            style={{marginLeft: 5}}
                        >
                            {fullscreen ? <FullscreenExitIcon/>: <FullscreenIcon/>}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={"Network view"}>
                        <IconButton
                            onClick={()=>{
                                const {view, page, group_page, ...query} = router.query
                                // query.view = 'network'
                                router.push({
                                    pathname: `/${page}/${group_page}`,
                                    query
                                }, undefined, {shallow: true})
                            }}
                            style={{marginLeft: 5, borderRadius: 5, background: (!view) ? "#e0e0e0": "none"}}
                        >
                            <span className='mdi mdi-graph'/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={"Table view"}>
                        <IconButton
                            onClick={()=>{
                                router.push({
                                    query: {
                                        ...router.query,
                                        view: "table"
                                    }
                                }, undefined, {shallow: true})
                            }}
                            style={{marginLeft: 5, borderRadius: 5, background: view === "table" ? "#e0e0e0": "none"}}
                        >
                            <span className='mdi mdi-table'/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={"Save subnetwork"}>
                        <IconButton
                            onClick={()=>process_tables(elements)}
                            style={{marginLeft: 5, borderRadius: 5}}
                        >
                            <SaveIcon/>
                        </IconButton>
                    </Tooltip>
                    {(!view) &&
                        <React.Fragment>
                            <Tooltip title={tooltip ? "Hide tooltip": "Show tooltip"}>
                                <IconButton variant='contained'
                                    onClick={()=>{
                                        const {tooltip, page='', group_page, ...query} = router.query
                                        if (!tooltip) query.tooltip = true
                                        router.push({
                                            pathname: `/${page}/${group_page}`,
                                            query
                                        }, undefined, {shallow: true})
                                    }}
                                    style={{marginLeft: 5}}
                                >
                                    {tooltip ? <span className='mdi mdi-tooltip-remove'/>: <span className='mdi mdi-tooltip'/>}
                                </IconButton>
                            </Tooltip>
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
                                    const {layout, page, group_page, ...query} = router.query
                                    query.layout = label
                                    router.push({
                                        pathname: `/${page}/${group_page}`,
                                        query
                                    }, undefined, {shallow: true})
                                    handleCloseMenu(setAnchorElLayout)
                                }}>
                                    <ListItemIcon>
                                        {icon()}
                                    </ListItemIcon>
                                    <ListItemText>{label}</ListItemText>
                                </MenuItem>
                                ))}
                            </Menu>
                            <Tooltip title={edge_labels ? "Hide edge labels": "Show edge labels"}>
                                <IconButton variant='contained'
                                    onClick={()=>{
                                        // if (edgeStyle.label) setEdgeStyle({})
                                        // else setEdgeStyle({label: 'data(label)'})
                                        const {edge_labels, page, group_page, ...query} = router.query
                                        if (!edge_labels) query.edge_labels = true
                                        router.push({
                                            pathname: `/${page}/${group_page}`,
                                            query
                                        }, undefined, {shallow: true})
                                    }}
                                    style={{marginLeft: 5}}
                                >
                                    {edge_labels ? <VisibilityOffIcon/>: <VisibilityIcon/>}
                                </IconButton>
                            </Tooltip>
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
                                <Tooltip title={!legend ? "Show legend": "Hide legend"}>
                                    <IconButton variant='contained'
                                        onClick={()=>{
                                            const {legend, legend_size, page, group_page, ...query} = router.query
                                            if (!legend) query.legend = true
                                            router.push({
                                                pathname: `/${page}/${group_page}`,
                                                query
                                            }, undefined, {shallow: true})
                                        }}
                                        style={{marginLeft: 5}}
                                    >
                                        {!legend ? <LabelIcon />: <LabelOffIcon />}
                                    </IconButton>
                                </Tooltip>
                                {legend &&
                                    <Tooltip title="Adjust legend size">
                                        <IconButton variant='contained'
                                            onClick={()=>{
                                                const {legend_size=0, page, group_page, ...query} = router.query
                                                query.legend_size = (parseInt(legend_size) +1)%5
                                                router.push({
                                                    pathname: `/${page}/${group_page}`,
                                                    query
                                                }, undefined, {shallow: true})
                                            }}
                                            style={{marginLeft: 5}}
                                        >
                                            {legend_size < 4 ? <ZoomInIcon/>: <ZoomOutIcon/>}
                                        </IconButton>
                                    </Tooltip>
                                }
                        </React.Fragment>
                    }
                </Stack>
            </Grid>
        </Grid>
    )

}

export default withRouter(AsyncForm)