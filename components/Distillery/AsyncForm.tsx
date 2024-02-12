'use client'
import React, {useState, useEffect} from "react";
import dynamic from "next/dynamic";
import { useRouter, usePathname } from "next/navigation";
import { layouts } from "../misc/Cytoscape";
import { useQueryState } from 'next-usequerystate'

import { Tooltip, 
    IconButton,
    Grid,
    Autocomplete,
    Typography,
    TextField,
    CircularProgress,
    Checkbox,
    FormControlLabel,
    Stack,
    Slider,
    ListItemIcon,
    ListItemText
} from "@mui/material";
import { Selector } from "../misc";

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
import { router_push } from "@/utils/client_side";
import { NetworkSchema } from "@/app/api/knowledge_graph/route";
const AsyncForm = ({ 
    default_term, 
    checkbox_filter,
    filter_text,
    type,
    fields,
    options_endpoint,
    searchParams,
    elements
}: {
    default_term: string,
    checkbox_filter?: {[key:string]: any},
    filter_text?: string,
    type: string,
    fields: Array<string>,
    options_endpoint: string,
    searchParams: {
        term?: string,
        field?: string,
        limit?: string,
        fullscreen?:'true',
        view?:string
    },
    elements: NetworkSchema

}) => {
    const router = useRouter()
    const pathname = usePathname()
    const [options, setOptions] = useState<{[key:string]: {[key:string]:any}}>({})
    const [term, setTerm] = useState<string>(searchParams.term || default_term)
    const [filter, setFilter] = useState(checkbox_filter)
    const [open, setOpen] = useState(false)
    const [controller, setController] = useState(null)
    const [loading, setLoading] = useState(true)
    const [anchorEl, setAnchorEl] = useState(null)
    const [anchorElLayout, setAnchorElLayout] = useState(null)
    const [selected, setSelected] = useState(null)
    const [tooltip, setTooltip] = useQueryState('tooltip')
    const [edge_labels, setEdgeLabels] = useQueryState('edge_labels')
    const [legend, setLegend] = useQueryState('legend')
    const [legend_size, setLegendSize] = useQueryState('legend_size')
    const [layout, setLayout] = useQueryState('layout')
    const {
        field='label',
        limit,
        fullscreen,
        view,
    } = searchParams

    useEffect(()=>{
        if (searchParams.term === undefined) {    
            router_push(router, pathname, {
                type,
                field,
                term, 
            })
        } 
    }, [searchParams.term])

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
            const query = {
                field,
            }
            query["type"] = type
            if (filter) query["filter"]=JSON.stringify(filter)
            if (term) query["term"] = term
            if (limit) query["limit"] = limit
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
    },[pathname])

    useEffect(()=>{
        setTerm(searchParams.term)
    }, [searchParams.term])

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
            router_push(router, pathname, {
                term: selected[field],
                field
            })
        }
    }, [field])

    return (
        <Stack direction={"column"} spacing={1}>
            <Typography><b>Select {type}:</b></Typography>
            <Autocomplete
                sx={{ width: 215 }}
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
                    const {term, ...query} = searchParams
                    if (!value) {
                        setTerm('')
                    }
                    else {
                        setTerm(value)
                        router_push(router, pathname, {...query, term: value})
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
                            sx: {
                                fontSize: 12,
                                height: 45,
                                width: "100%",
                                paddingLeft: 5,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignContent: "flex-start",
                                backgroundColor: "#FFF"
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
            <Typography><b>Select Field:</b></Typography>
            <Selector entries={fields} 
                value={field ||"label"} 
                prefix={"Field"} onChange={(e)=>{
                    const {field="label", ...query} = searchParams
                    router_push(router, pathname, {
                        ...query,
                        field: e
                    })
                }}/>

            {checkbox_filter && <FormControlLabel control={<Checkbox checked={filter!==null} onClick={()=>{
                if (filter) setFilter(null)
                else setFilter(checkbox_filter)
            }}/>} label={filter_text} />}
        </Stack>
    )

}

export default AsyncForm