import dynamic from "next/dynamic";
import Image from "next/image";

const Grid = dynamic(import('@mui/material/Grid'));
const Typography = dynamic(import('@mui/material/Typography'));


const Header = () => {
	return (
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
	)
}

export default Header
