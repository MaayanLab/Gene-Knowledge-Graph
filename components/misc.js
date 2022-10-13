import React from 'react';
import dynamic from 'next/dynamic'
import { precise, makeTemplate, toNumber } from '../utils/helper';
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery';

const Grid = dynamic(() => import('@mui/material/Grid'));
const Box = dynamic(() => import('@mui/material/Box'));
const Typography = dynamic(() => import('@mui/material/Typography'));
const FormControl = dynamic(() => import('@mui/material/FormControl'));
const Select = dynamic(() => import('@mui/material/Select'));
const MenuItem = dynamic(() => import('@mui/material/MenuItem'));
const Button = dynamic(() => import('@mui/material/Button'));
const Card = dynamic(() => import('@mui/material/Card'));
const CardContent = dynamic(() => import('@mui/material/CardContent'));
const Checkbox = dynamic(() => import('@mui/material/Checkbox'));
const Avatar = dynamic(() => import('@mui/material/Avatar'));

export const TooltipCard = ({node, tooltip_templates, setFocused, router, schema, top, right}) => {
    const theme = useTheme();
    const matches = useMediaQuery(theme.breakpoints.up('lg'));
    const sm = useMediaQuery(theme.breakpoints.down('sm'));
  
    const elements = []
    const field = node.kind === "Relation" ? node.label : node.kind
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
          zIndex: 'tooltip',
          position: 'absolute',
          top: top || (matches ? 550: sm ? 1050: 850),
          right: right || '10%',
        }}>
        <Card>
          <CardContent>
            <Typography variant="h6">
              <b>{node.label}</b>
            </Typography>
            {elements}
            {node.kind !== "Relation" && <Button
              variant="outlined"
              onClick={()=>{
                setFocused(null)
                router.push({
                  pathname: schema.endpoint || '/',
                  query: {
                    start: node.kind,
                    start_term: node.label
                  }
                }, undefined, { shallow: true })
              }}
            >Expand</Button>}
          </CardContent>
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
  
  export const Legend = ({elements=[], left, top}) => {
    const theme = useTheme();
    const matches = useMediaQuery(theme.breakpoints.up('lg'));
    const sm = useMediaQuery(theme.breakpoints.down('sm'));
    const colors = {
      "Search Term": <Grid item xs={12} key={"search"}>
      <Grid container alignItems={"center"} spacing={2}>
        <Grid item><Avatar sx={{background: "#F8333C"}}> </Avatar></Grid>
        <Grid item><Typography>Search Term</Typography></Grid>   
      </Grid></Grid>     
    }
    for (const i of elements) {
      const {kind, color} = i.data
      if (colors[kind]===undefined && color !== "#F8333C" && kind !== "Relation") {
        colors[kind] = <Grid item xs={12}>
          <Grid container alignItems={"center"} spacing={2} key={kind}>
            <Grid item><Avatar sx={{background: color}}> </Avatar></Grid>
            <Grid item><Typography>{kind}</Typography></Grid>   
          </Grid></Grid> 
      }
    }
    return (
      <Box sx={{
        zIndex: 1,
        position: 'absolute',
        top: top || (matches ? 550: sm ? 1050: 850),
        left: left || '10%',
        pointerEvents: "none"
      }}>
          <Grid container alignItems={"center"} spacing={1}>
            <Grid item xs={12}>
              <Typography variant="h6">
                <b>Legend</b>
              </Typography>
            </Grid>
            {Object.values(colors)}
          </Grid>
      </Box>
    )
  }