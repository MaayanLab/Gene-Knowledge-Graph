import dynamic from 'next/dynamic'
import Image from 'next/image'

const Grid = dynamic(()=>import('@mui/material/Grid'))
const Link = dynamic(()=>import('@mui/material/Link'))
const Paper = dynamic(()=>import('@mui/material/Paper'))
const Typography = dynamic(()=>import('@mui/material/Typography'))
const Button = dynamic(async () => (await import('@mui/material')).Button);

const GitHubIcon = dynamic(()=>import('@mui/icons-material/GitHub'));
const BugReportIcon = dynamic(()=>import('@mui/icons-material/BugReport'));

const Footer = () => (
	<Paper square style={{boxShadow: "none", height: 250, marginTop: 20, background: "lightgray", paddingTop: 40}}>
		<Grid container justifyContent="center" style={{marginBottom: 10}}>
			<Grid item xs={4}>
				<Grid container direction="column">
					<Grid item>
						<Button 
							// variant="contained"
							startIcon={<GitHubIcon/>}
							href="https://github.com/nih-cfde/ReproToxTables"
							style={{textTransform: "none", color: "#000"}}
						>
							ReproTox Repository
						</Button>
					</Grid>
					<Grid item>
						<Button 
							// variant="contained"
							startIcon={<BugReportIcon/>}
							href="https://github.com/nih-cfde/ReproToxTables/issues"
							style={{textTransform: "none", color: "#000"}}
						>
							Report a bug
						</Button>
					</Grid>
					<Grid item style={{marginTop:5}}>
						<Grid container>
							<Grid item>
								<Image src={`${process.env.NEXT_PUBLIC_PREFIX}/static/icons/flaticon.png`} alt="icon" height={24} width={24}/>
							</Grid>
							<Grid item xs={5}>
								<Typography variant="subtitle2" align="left">
									Icons and logos made by <Link href="https://www.freepik.com" style={{color: "#3f51b5"}}>Freepik</Link>, <Link href="https://www.flaticon.com/authors/smashicons" style={{color: "#3f51b5"}}>Smashicons</Link>, <Link href="https://www.flaticon.com/authors/andrejs-kirma" style={{color: "#3f51b5"}}>Andrejs Kirma</Link>, and <Link href="https://www.flaticon.com/authors/icon-home" style={{color: "#3f51b5"}}>Icon home</Link> from <Link href="https://www.flaticon.com" style={{color: "#3f51b5"}}>www.flaticon.com</Link>
								</Typography>
							</Grid>
						</Grid>
					</Grid>
				</Grid>
			</Grid>
			<Grid item  xs={4}>
				<Image 
					// loader={()=>'/birth-defect-drugs/static/CFDE-logo.png'}
					src={`${process.env.NEXT_PUBLIC_PREFIX}/static/icons/CFDE-logo.png`}
					alt="cfde"
					width={200}
					height={100}
				/>
			</Grid>
			<Grid item xs={2}>
				<Typography variant="subtitle2" style={{textAlign: "left"}}>
					This website is a prototype developed for the CFDE Toxicology Screening Pipeline for Structural Birth Defects Partnership.
				</Typography>
			</Grid>
		</Grid>
	</Paper>
)

export default Footer