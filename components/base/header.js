import dynamic from "next/dynamic";
import Image from "next/image";

const Grid = dynamic(import('@mui/material/Grid'));
const Typography = dynamic(import('@mui/material/Typography'));
const Button = dynamic(async () => (await import('@mui/material')).Button);


const Header = ({resources, nodes}) => { // add resources props
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
				let minWidth = 100
				if (val.name === "LINCS") minWidth=120
				return(
					<Grid item xs={2} key={val.id}>
						<Button>
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
