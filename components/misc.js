import React from 'react';
import dynamic from 'next/dynamic'
import { precise, makeTemplate } from '../utils/helper';
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery';
import DeleteIcon from '@mui/icons-material/Delete';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import AllOutIcon from '@mui/icons-material/AllOut';
import CloseIcon from '@mui/icons-material/Close';
import HubIcon from '@mui/icons-material/Hub';

const Grid = dynamic(() => import('@mui/material/Grid'));
const Box = dynamic(() => import('@mui/material/Box'));
const Typography = dynamic(() => import('@mui/material/Typography'));
const FormControl = dynamic(() => import('@mui/material/FormControl'));
const Select = dynamic(() => import('@mui/material/Select'));
const MenuItem = dynamic(() => import('@mui/material/MenuItem'));
const Button = dynamic(() => import('@mui/material/Button'));

const Card = dynamic(() => import('@mui/material/Card'));
const CardHeader = dynamic(() => import('@mui/material/CardHeader'));
const CardContent = dynamic(() => import('@mui/material/CardContent'));
const CardActions = dynamic(() => import('@mui/material/CardActions'));

const Checkbox = dynamic(() => import('@mui/material/Checkbox'));
const Avatar = dynamic(() => import('@mui/material/Avatar'));

export const TooltipCard = ({node, tooltip_templates, setFocused, router, schema, top, right, endpoint="/", expand=true, reset=null}) => {
    const elements = []
    const field = node.kind === "Relation" ? node.label : node.kind.replace("Co-expressed Gene", "Gene")
    for (const i of tooltip_templates[field] || []) {
      if (i.type === "link") {
        const text = makeTemplate(i.text, node.properties)
        const href = makeTemplate(i.href, node.properties)
        if (text !== 'undefined') {
          elements.push(
            <Typography key={i.label} variant="subtitle2">
              <b>{i.label}</b> <Button size='small' 
                  style={{padding: 0}} 
                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
              >{text}</Button>
            </Typography>  
          )
        }
      } else {
        let e = makeTemplate(i.text, node.properties)
        if (e !== 'undefined') {
          elements.push(
            <Typography key={i.label} variant="subtitle2">
              <b>{i.label}</b> {i.type === "text" ? e: precise(e)}
            </Typography>  
          )
        }
      }
    }
    return(
      <Box sx={{
        zIndex: 2,
        position: 'absolute',
        top: 25,
        left: 25,
        maxWidth: 400
      }}
      border={1}
      >
        <Card>
          <CardHeader
            action={
              <IconButton aria-label="settings" onClick={ ()=>{
                  if (reset) reset()
              }}>
                <CloseIcon />
              </IconButton>
            }
            title={node.label}
          />

          <CardContent>
            {elements}
          </CardContent>
          {node.kind !== "Relation" &&
            <CardActions>
              {!router.query.end_term && <Tooltip title="Delete Node">
                <IconButton
                  onClick={()=>{
                    setFocused(null)
                    const {page, remove: r, ...query} = router.query
                    const remove = r !== undefined ? JSON.parse(r) : []
                    router.push({
                      pathname: endpoint,
                      query: {
                        ...query,
                        remove: JSON.stringify([...remove, node.id])
                      }
                    }, undefined, { shallow: true })
                  }}
                ><DeleteIcon/></IconButton>
              </Tooltip>}
              { expand && <Tooltip title="Expand Node">
                <IconButton
                  onClick={()=>{
                    setFocused(null)
                    const {page, expand: e, ...query} = router.query
                    const expand = e !== undefined ? JSON.parse(e) : []
                    router.push({
                      pathname: endpoint,
                      query: {
                        ...query,
                        expand: JSON.stringify([...expand, node.id])
                      }
                    }, undefined, { shallow: true })
                  }}
                ><AllOutIcon/></IconButton>
              </Tooltip>}
              <Tooltip title="Open in Term & Gene Search">
                <IconButton
                  onClick={()=>{
                    setFocused(null)
                    const {page, expand: e, ...query} = router.query
                    const expand = e !== undefined ? JSON.parse(e) : []
                    router.push({
                      pathname: (schema.header.tabs.filter(i=>i.component === 'KnowledgeGraph')[0] || {}).endpoint || '/',
                      query: {
                        start: node.kind,
                        start_term: node.label
                      }
                    }, undefined, { shallow: true })
                  }}
                ><HubIcon sx={{transform: "scaleX(-1)"}}/></IconButton>
              </Tooltip>
            </CardActions>
          }
        </Card>
      </Box>
    )
  }
  
  export const Selector = ({entries, value, onChange, prefix, sx, ...props }) => {
    if (entries.length === 1) return null
    else return (
      <FormControl>
        <Select
          labelId={`${prefix}layouts-select`}
          id={`${prefix}-label`}
          value={value}
          onChange={(e,v)=>onChange(e.target.value)}
          variant="outlined"
          sx={{width: 215, padding: 0, height: 45, ...sx}}
          {...props}
          >
          {entries.map(val=>(
            <MenuItem key={val} value={val}>{props.multiple && <Checkbox checked={value.indexOf(val)>-1}/>}{val.replace(/_/g," ")}</MenuItem>
          ))}
        </Select>
      </FormControl>
    )
  
  }
  
  export const Legend = ({elements=[], search=true, left, top, legendSize=0}) => {
    const theme = useTheme();
    const matches = useMediaQuery(theme.breakpoints.up('lg'));
    const sm = useMediaQuery(theme.breakpoints.down('sm'));
    const colors = {  
    }
    const relation_colors = {  
    }
    const sizes = [15, 20, 30, 40, 50]
    const lineHeight = [2, 3, 4, 5, 6]
    const lineWidth = [20, 25, 30, 35, 40]
    const borders = [2, 2, 4, 6, 8]
    if (search) {
      colors["Search Term"] = <Grid item xs={12} key={"search"}>
      <Grid container alignItems={"center"} spacing={2} key="term">
        <Grid item><Avatar sx={{background: "#ff8a80", width: sizes[legendSize], height: sizes[legendSize]}}> </Avatar></Grid>
        <Grid item><Typography variant="subtitle1">Search Term</Typography></Grid>   
      </Grid></Grid>   
    }
    let not_significant = false
    const color_sum = {}
    const relations = []
    for (const i of elements) {
      const {kind, color, borderColor, lineColor, relation} = i.data
      if (i.data.properties.pval && i.data.properties.pval > 0.05) not_significant = true
      if (kind === "Relation" && lineColor !== "#e0e0e0" && relation_colors[relation]===undefined) {
        relation_colors[relation] = <Grid item xs={12} key={kind}>
          <Grid container alignItems={"center"} spacing={1}>
            <Grid item><hr style={{color: lineColor, height: lineHeight[legendSize], backgroundColor: lineColor, width: lineWidth[legendSize]}}/></Grid>
            <Grid item><Typography variant="subtitle1">{relation}</Typography></Grid>   
          </Grid></Grid>
      }
      if (colors[kind]===undefined && color !== "#ff8a80" && kind !== "Relation") {
        color_sum[kind] = color
        colors[kind] = <Grid item xs={12} key={kind}>
          <Grid container alignItems={"center"} spacing={1}>
            <Grid item><Avatar style={{background: color, width: sizes[legendSize], height: sizes[legendSize], borderColor, borderStyle: borderColor ? "solid": "none", borderWidth: borders[legendSize]}}> </Avatar></Grid>
            <Grid item><Typography variant="subtitle1">{kind}</Typography></Grid>   
          </Grid></Grid> 
      }
      if (colors[kind]!==undefined && color_sum[kind] === "#bdbdbd" && color !== "#ff8a80" && kind !== "Relation") {
        color_sum[kind] = color
        colors[kind] = <Grid item xs={12} key={kind}>
          <Grid container alignItems={"center"} spacing={1}>
            <Grid item><Avatar sx={{background: color, width: sizes[legendSize], height: sizes[legendSize], borderColor, borderWidth: borders[legendSize]}}> </Avatar></Grid>
            <Grid item><Typography variant="subtitle1">{kind}</Typography></Grid>   
          </Grid></Grid> 
      }
    }
    if (!search && not_significant) {
      colors["Not significant"] = <Grid item xs={12} key={"significant"}>
      <Grid container alignItems={"center"} spacing={1} key="significant">
        <Grid item>
          <Avatar style={{background: "#FFF", borderColor: "#757575", borderStyle: "solid", borderWidth: borders[legendSize], width: sizes[legendSize], height: sizes[legendSize]}}> </Avatar>
        </Grid>
        <Grid item><Typography variant="subtitle1">{`Not significant (pval > 0.05)`}</Typography></Grid>   
      </Grid></Grid>   
    }
    return (
      <Box sx={{
        zIndex: 1,
        position: 'absolute',
        top: 25,
        left: 25,
        pointerEvents: "none"
      }}>
          <Grid container alignItems={"center"} spacing={legendSize > 1 ? 1: 0} style={{maxHeight: 700, overflow: "hidden"}}>
            <Grid item xs={12}>
              <Typography variant="h6">
                <b>Legend</b>
              </Typography>
            </Grid>
            {Object.values(colors)}
            {Object.values(relation_colors)}
          </Grid>
      </Box>
    )
  }