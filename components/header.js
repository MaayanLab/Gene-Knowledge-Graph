import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from 'next/image'
import { makeTemplate } from "../utils/helper";
import * as default_schema from '../public/schema.json'
import { useRouter } from 'next/router'

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip  from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import parse from 'html-react-parser';

const Grid = dynamic(() => import('@mui/material/Grid'));
const Stack = dynamic(() => import('@mui/material/Stack'));
const Typography = dynamic(() => import('@mui/material/Typography'));
const MenuIcon = dynamic(import('@mui/icons-material/Menu'));
const Counter = dynamic(import('./counter'));

const function_mapper = {
	filter_relation: ({router, relation})=>{
		const {page, relation: old_rel, ...query} = router.query
		const old_relation = old_rel ? old_rel.split(","): []

		const updated_relation = []
		for (const i of old_relation) {
			if (relation.indexOf(i) === -1) {
				updated_relation.push(i)
			}
		}
		for (const i of relation) {
			if (old_relation.indexOf(i) === -1) {
				updated_relation.push(i)
			}
		}

		if (updated_relation.length) query.relation = updated_relation.join(",")
		router.push({
			pathname: `/${page || ''}`,
			query
		}, undefined, {shallow: true})
	},
	add_library: ({router, libraries}) => {
		const {page, libraries: old_lib, ...query} = router.query
		const old_libraries = JSON.parse(old_lib || "[]").reduce((acc, i)=>({
			...acc,
			[i.library]: i
		}), {})
		const new_libraries = libraries.reduce((acc, i)=>({
			...acc,
			[i.library]: i
		}), {})
		const updated_libraries = []
		for (const i of Object.keys(old_libraries)) {
			if (new_libraries[i] === undefined) {
				updated_libraries.push(old_libraries[i])
			}
		}
		for (const i of Object.keys(new_libraries)) {
			if (old_libraries[i] === undefined) {
				updated_libraries.push(new_libraries[i])
			}
		}
		if (updated_libraries.length) {
			query.libraries = JSON.stringify(updated_libraries)
			router.push({
				pathname: `/${page || ''}`,
				query
			}, undefined, {shallow: true})
		} else {
			router.push({
				pathname: `/${page || ''}`,
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
		},
		"&:focus": {
			background: "#9e9e9e",
		},
		"&:enabled": {
			background: "#9e9e9e",
		},
		verticalAlign: "center",
	}
  }

const IconRenderer = ({label, icon, height=100, width=100, href, router, subheader={}, props}) => {
	let selected
	let for_selection
	if (subheader.field) {
		if (subheader.list_field) {
			selected = []
			for_selection = []
			for (const i of JSON.parse(router.query[subheader.field] || "[]")) {
				selected.push(i[subheader.list_field])
			}
			for (const i of props[subheader.field]) {
				for_selection.push(i[subheader.list_field])
			}
		} else {
			selected = router.query[subheader.field] ? router.query[subheader.field].split(","): []
			for_selection = props[subheader.field]
		}
	}
	let buttonStyle = styles.enabled
	if (selected !== undefined) {
		const isSelected = selected.filter(i=>for_selection.indexOf(i) > -1)
		if (selected.length && isSelected.length > 0) buttonStyle = styles.active
		else if (selected.length && isSelected.length === 0) buttonStyle = styles.disabled	
	}
	if (subheader.onClick !== undefined) {
		return (
			<Tooltip title={label} key={label}>
				<Button 
					onClick={()=>{
						function_mapper[subheader.onClick](({router, ...props}))
						
					}}
					sx={buttonStyle}
				>
					<div style={{height: 100, minWidth: width, ...buttonStyle}}>
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
			</Tooltip>
		)
	} else if (href !== undefined) {
		return (
			<Tooltip title={label} key={label}>
				<Button 
					href={href}
					target="_blank"
					rel="noopener noreferrer"
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
			</Tooltip>
		)
	} else {
		return (
			<Tooltip title={label} key={label}>
				<Button 
					sx={buttonStyle}
					href={"/"}
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
			</Tooltip>
		)
	}
}


const Header = ({schema, ...rest}) => {
	const [anchorEl, setAnchorEl] = useState(null);
  	const open = Boolean(anchorEl);
	const router = useRouter()

	const handleClickMenu = (e) => {
		setAnchorEl(e.currentTarget);
	  };
	const handleCloseMenu = () => {
		setAnchorEl(null);
	};

	if (!schema) schema = default_schema
	const icon_buttons = []
	const selection_rules = {}
	for (const i of ((schema.header || {}).subheader||[])) {
		icon_buttons.push(
			<Grid item key={i.label} sx={{margin: 0.1}}>
				<IconRenderer
					router={router}
					key={i.label}
					{...i}
					{...rest}
				/>
			</Grid>
		)
		for (const s of (i.props || {}).selected || []) {
			selection_rules[s] = i.label
		}
	}
	
	if (schema === undefined || schema.header === undefined) return null
	
	return(
	<Grid container justifyContent="center">
		<Grid item xs={12} align="center">
			<Grid container justifyContent={"space-between"} alignItems={"center"} style={{padding: 15, marginBottom: 10, background: schema.header.background.backgroundColor}}>
				<Grid item>
					<Button href={`${process.env.NEXT_PUBLIC_PREFIX || "/"}`}>
						<Stack direction={"row"} alignItems="center">
							<div style={{height: schema.header.icon.height || 30, 
								minWidth: schema.header.icon.width || 30}}>
								<Image 
									layout="responsive"
									objectFit="contain"
									width={schema.header.icon.width || 30}
									height={schema.header.icon.height || 30}
									src={makeTemplate(schema.header.icon.src, {})}
									alt={makeTemplate(schema.header.icon.alt, {})}
								/>
							</div>
							<Typography variant="h4">{parse(schema.header.title)}</Typography>
						</Stack>
					</Button>
				</Grid>
				<Grid item align="left">
					<Stack direction={"row"} alignItems="center">
					<Counter fontColor={schema.header.background.contrastText}/>
					{schema.header.tabs && 
					<Button onClick={handleClickMenu}
						aria-controls={open ? 'basic-menu' : undefined}
						aria-haspopup="true"
						aria-expanded={open ? 'true' : undefined}
						sx={{color: schema.header.background.contrastText}}
					><MenuIcon/></Button>}
					{ schema.header.tabs && 
						<Menu
							id="basic-menu"
							anchorEl={anchorEl}
							open={open}
							onClose={handleCloseMenu}
							MenuListProps={{
								'aria-labelledby': 'basic-button',
							}}
						>
							{schema.header.tabs.map(t=>(
								<MenuItem key={t.label} onClick={()=> {
									handleCloseMenu()
									router.push(t.endpoint)
								}}>{t.label}</MenuItem>
							))}
						</Menu>
					}
					</Stack>
				</Grid>
			</Grid>	
		</Grid>
		{icon_buttons}
	</Grid>
)}
export default Header