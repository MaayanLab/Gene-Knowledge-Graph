import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/router";
import { fetch_nodes_of_resource } from "../../utils/search";
const Grid = dynamic(import('@mui/material/Grid'));
const Typography = dynamic(import('@mui/material/Typography'));
const Button = dynamic(async () => (await import('@mui/material')).Button);

const styles = {
	disabled: {
		opacity: .4
	},
	enabled: {
		opacity: 1,
	},
	active: {
		opacity: 1,
		background: "#c5e1a5",
		"&:hover": {
			background: "#f1f8e9",
		}
	}
  }

const Header = ({resources, activeResource, start, end, setActive, setActiveResource}) => {
	const [clicked, setClicked] = useState(null)
	const router = useRouter()
	const respondClick = async (c) => {
		if (c !== clicked) {
			const response = await fetch_nodes_of_resource(c)
			const active = {}
			if (response.start) active.start = response.start.map(i=>i.id)
			if (response.end) active.end = response.end.map(i=>i.id)
			setClicked(c)
			console.log(active)
			setActive(active)
			setActiveResource(null)
			// setStart(null)
			// setEnd(null)
		} else {
			setClicked(null)
			setActive(null)
			// setStart(null)
		}
	}
	return (
		<Grid container spacing={3} justifyContent="center" alignItems="center" style={{margin:10}}>
			<Grid item xs={12} align="center">
				<Grid container justifyContent="center" alignItems="center">
					<Grid item align="right">
						<Image
							// loader={()=>`/birth-defect-drugs${val.icon}`} 
							src={`${process.env.NEXT_PUBLIC_PREFIX}/static/icons/CFDE-logo.png`}
							height={70}
							width={130}
							layout="fixed"
						/>
					</Grid>
					<Grid item align="left" style={{marginRight: 20}}>
						<Image
							// loader={()=>`/birth-defect-drugs${val.icon}`} 
							src={`${process.env.NEXT_PUBLIC_PREFIX}/static/icons/kx-logo.png`}
							height={70}
							width={70}
							layout="fixed"
						/>
					</Grid>
					<Grid item align="left">
						<Typography variant="h4">
							<b>CFDE K</b>nowledge<b>X</b>change
						</Typography>
					</Grid>
				</Grid>
			</Grid>
			{resources.map((val)=>{
				let buttonStyle = styles.disabled
				if (start===null && end===null && router.pathname === "/") {
					if (clicked !==null &&  clicked === val.id) buttonStyle = styles.active
					else if (clicked === null) buttonStyle = styles.enabled
				} else if (activeResource && activeResource.indexOf(val.id) > -1) buttonStyle = styles.active
				
				let minWidth = 100
				if (val.name === "LINCS") minWidth=120
				return(
					<Grid item xs={2} key={val.id}>
						<Button 
							style={buttonStyle}
							onClick={()=>respondClick(val.id)}
						>
							<div style={{height: 70, minWidth}}>
								<Image
									// loader={()=>`/birth-defect-drugs${val.icon}`} 
									src={`${process.env.NEXT_PUBLIC_PREFIX}${val.icon}`}
									height={70}
									width={minWidth}
									layout="responsive"
									objectFit="contain"
									alt={val.name}
								/>
							</div>
						</Button>
					</Grid>
				)
			})}
		</Grid>
	)
}

export default Header
