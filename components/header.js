import dynamic from "next/dynamic";
import Image from 'next/image'
import { makeTemplate } from "../utils/helper";
const Grid = dynamic(() => import('@mui/material/Grid'));
const Typography = dynamic(() => import('@mui/material/Typography'));

const Header = ({schema, ...rest}) => {
	if (schema === undefined || schema.header === undefined) return null
	return(
	<Grid container justifyContent={"center"} alignItems={"center"} spacing={2} style={{marginBottom: 20}}>
		<Grid item xs={12} align="center">
			<Typography variant="h4">{schema.header.title}</Typography>
		</Grid>
		{((schema.header || {}).subheader||[]).map(({label, icon})=>(
			<Grid item key={label} style={{marginLeft: 10, marginRight: 10}}>
				<div style={{height: 50, minWidth: 50}}>
					<Image
						// loader={()=>`/birth-defect-drugs${val.icon}`} 
						src={makeTemplate(icon, {})}
						height={50}
						width={50}
						layout="responsive"
						objectFit="contain"
						alt={label}
					/>
				</div>
			</Grid>
		))}
	</Grid>
)}
export default Header