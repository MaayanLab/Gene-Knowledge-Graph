import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from 'next/image'
import { makeTemplate } from "../utils/helper";
import * as default_schema from '../public/schema.json'
import { useRouter } from 'next/router'

const Grid = dynamic(() => import('@mui/material/Grid'));
const Typography = dynamic(() => import('@mui/material/Typography'));
const Button = dynamic(() => import('@mui/material/Button'));

const function_mapper = {
	filter_relation: ({relations, router, selected, label, relation})=>{
		if (relations.join(",") === relation) {
			const {relation: re, ...query} = router.query
			router.push({
				pathname: router.route || '/',
				query
			  }, undefined, {shallow: true})
		}
		else {
			router.push({
				pathname: router.route || '/',
				query: {
					...router.query,
					relation: relations.join(",")
				}
			  }, undefined, {shallow: true})
		}
	}
}

const styles = {
	disabled: {
		opacity: .4
	},
	enabled: {
		opacity: 1,
	},
	active: {
		opacity: 1,
		background: "#e0e0e0",
		"&:hover": {
			background: "#9e9e9e",
		}
	}
  }

const IconRenderer = ({label, icon, height=100, width=100, onClick, router, selected, setSelected, relation}) => {
	let buttonStyle = styles.enabled
	if (selected.length && selected.indexOf(label) > -1) buttonStyle = styles.active
	if (selected.length && selected.indexOf(label) === -1) buttonStyle = styles.disabled
	if (onClick !== undefined) {
		const rels = (relation || "").split(",")
		const rel = (onClick.props.relations || []).filter(i=>rels.indexOf(i) > -1)
		// console.log(label, selected)
		if (label === "GlyGen") console.log(rel.length, selected)
		if (rel.length && selected.indexOf(label)=== -1) setSelected([...selected, label])
		return (
			<Button 
				onClick={()=>{
					function_mapper[onClick.name](({...onClick.props, router, selected, label, relation}))
					if (selected.indexOf(label)=== -1) setSelected([...selected, label])
				}}
				sx={buttonStyle}
			>
				<div style={{height, minWidth: width, ...buttonStyle}}>
					<Image
						// loader={()=>`/birth-defect-drugs${val.icon}`} 
						src={makeTemplate(icon, {})}
						height={height}
						width={width}
						layout="responsive"
						objectFit="contain"
						alt={label}
					/>
				</div>
			</Button>
		)
	} else {
		return (
			<Button 
				sx={buttonStyle}
			>
				<div style={{height, minWidth: width}}>
					<Image
						// loader={()=>`/birth-defect-drugs${val.icon}`} 
						src={makeTemplate(icon, {})}
						height={height}
						width={width}
						layout="responsive"
						objectFit="contain"
						alt={label}
					/>
				</div>
			</Button>
		)
	}
}


const Header = ({schema, ...rest}) => {
	const [selected, setSelected] = useState([])
	const router = useRouter()
	const relation = router.query.relation

	useEffect(()=>{
		if (relation === undefined) setSelected([])
	}, [relation])

	if (!schema) schema = default_schema
	if (schema === undefined || schema.header === undefined) return null
	return(
	<Grid container justifyContent={"center"} alignItems={"center"} spacing={2} style={{marginBottom: 20}}>
		<Grid item xs={12} align="center">
			<Typography variant="h4">{schema.header.title}</Typography>
		</Grid>
		{((schema.header || {}).subheader||[]).map((props)=>(
			<Grid item key={props.label} style={{marginLeft: 10, marginRight: 10}}>
				<IconRenderer
					router={router}
					setSelected={setSelected}
					selected={selected}
					relation={relation}
					{...props}
				/>
			</Grid>
		))}
	</Grid>
)}
export default Header