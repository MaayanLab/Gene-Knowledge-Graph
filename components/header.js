import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from 'next/image'
import { makeTemplate } from "../utils/helper";
import * as default_schema from '../public/schema.json'
import { useRouter } from 'next/router'

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

const Grid = dynamic(() => import('@mui/material/Grid'));
const Typography = dynamic(() => import('@mui/material/Typography'));
const Button = dynamic(() => import('@mui/material/Button'));
const MenuIcon = dynamic(import('@mui/icons-material/Menu'));

const function_mapper = {
	filter_relation: ({router, relation})=>{
		router.push({
			pathname: router.route || '/',
			query: {
				...router.query,
				relation
			}
		  }, undefined, {shallow: true})
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

const IconRenderer = ({label, icon, height=100, width=100, onClick, href, router, selected, setSelected, relation}) => {
	let buttonStyle = styles.enabled
	if (selected.length && selected.indexOf(label) > -1) buttonStyle = styles.active
	else if (selected.length && selected.indexOf(label) === -1) buttonStyle = styles.disabled
	if (onClick !== undefined) {
		const rels = (relation || "").split(",")
		const rel = (onClick.props.relations || []).filter(i=>rels.indexOf(i) > -1)
		if (rel.length > 0 && selected.indexOf(label)=== -1) setSelected([...selected, label])
		return (
			<Button 
				onClick={()=>{
					let new_selected = selected
					let new_relations = relation ? relation.split(",") : []
					if (selected.indexOf(label)=== -1){ 
						new_selected = [...selected, label]
						new_relations = [...new_relations, ...(onClick.props.relations || [])]
					}
					else {
						new_selected = selected.filter(s=>s!==label)
						new_relations = new_relations.filter(i=> (onClick.props.relations || []).indexOf(i) === -1)
					}
					setSelected(new_selected)
					function_mapper[onClick.name](({...onClick.props, router, selected: new_selected, label, relation: new_relations.join(",")}))
				}}
				sx={buttonStyle}
			>
				<div style={{height:100, minWidth: 100, ...buttonStyle}}>
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
	} else if (href !== undefined) {
		return (
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
	const [anchorEl, setAnchorEl] = useState(null);
  	const open = Boolean(anchorEl);
	const router = useRouter()
	const relation = router.query.relation

	useEffect(()=>{
		if (relation === undefined) setSelected([])
	}, [relation])

	const handleClickMenu = (e) => {
		setAnchorEl(e.currentTarget);
	  };
	const handleCloseMenu = () => {
		setAnchorEl(null);
	};

	if (!schema) schema = default_schema
	if (schema === undefined || schema.header === undefined) return null
	return(
	<Grid container justifyContent={"center"} alignItems={"center"} spacing={2} style={{marginBottom: 20}}>
		<Grid item xs={12} align="center">
			{ schema.header.icon ?
				<Grid container justifyContent={"center"} alignItems={"center"} spacing={2}>
					<Grid item>
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
					</Grid>
					<Grid item>
						<Typography variant="h4"><b>{schema.header.title}</b></Typography>
					</Grid>
					{schema.header.tabs && 
						<Grid item align="left">
							<Button onClick={handleClickMenu}
								aria-controls={open ? 'basic-menu' : undefined}
								aria-haspopup="true"
								aria-expanded={open ? 'true' : undefined}
							><MenuIcon/></Button>
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
						</Grid>
					}
				</Grid>:<Typography variant="h4"><b>{schema.header.title}</b></Typography>
			}
			
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