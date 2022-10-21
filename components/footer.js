import dynamic from "next/dynamic";
import Image from 'next/image'
import { makeTemplate } from "../utils/helper";
import * as default_schema from '../public/schema.json'

const Grid = dynamic(() => import('@mui/material/Grid'));
const Paper = dynamic(() => import('@mui/material/Paper'));
const Button = dynamic(async () => (await import('@mui/material')).Button);

const GitHubIcon = dynamic(()=>import('@mui/icons-material/GitHub'));
const BugReportIcon = dynamic(()=>import('@mui/icons-material/BugReport'));

const FooterContents = ({footer, key}) => {
    if (footer.type == "github") {
        return (
            <Grid item  key={key}>
                <Grid container direction="column">
					<Grid item>
						<Button 
							// variant="contained"
							startIcon={<GitHubIcon/>}
							href={footer.code}
							style={{textTransform: "none", color: "#000"}}
						>
							Github Repository
						</Button>
					</Grid>
					<Grid item>
						<Button 
							// variant="contained"
							startIcon={<BugReportIcon/>}
							href={footer.issues}
							style={{textTransform: "none", color: "#000"}}
						>
							Report a bug
						</Button>
					</Grid>
                </Grid>
            </Grid>
        )
    } else if (footer.type == "icon") {
		if (footer.href) {
			return (
				<Button 
					href={footer.href}
					target="_blank"
					rel="noopener noreferrer"
					key={key}
				>
					<Image
						// loader={()=>`/birth-defect-drugs${val.icon}`} 
						src={makeTemplate(footer.src, {})}
						alt={footer.alt}
						width={footer.width || 200}
						height={footer.height || 100}
					/>
				</Button>
			)
		} else {
			return (
				<Grid item key={key}>
					<Image 
						// loader={()=>'/birth-defect-drugs/static/CFDE-logo.png'}
						src={makeTemplate(footer.src, {})}
						alt={footer.alt}
						width={footer.width || 200}
						height={footer.height || 100}
					/>
				</Grid>
			)
		}
    } else return null
}

const Footer = ({schema}) => {
    if (!schema) schema = default_schema
	if (schema === undefined || schema.footer === undefined) return null

    return (
        <Paper square style={{boxShadow: "none",
			height: 180,
			background: "lightgray",
			paddingTop: 40,
			flexShrink: 0
		}}>
            <Grid container justifyContent="space-around" alignItems={"center"}>
                {schema.footer.map(footer=><FooterContents key={footer.icon} footer={footer}/>)}
            </Grid>
        </Paper>
    )
}

export default Footer
