import Link from "next/link";
import Image from "next/image";
import { Grid,
	Typography,
	Card,
	CardContent,
	CardHeader,
	Avatar,
	IconButton 
} from '@mui/material'

import ExitToAppIcon from '@mui/icons-material/ExitToApp'


export default function DistilleryLanding({
    title='',
    description='',
    pages=[]
}: {
	title?: string,
	description?: string,
	pages?: Array<{
		endpoint: string,
		label: string,
		props: {
			[key: string]: any
		}
	}>
}) {
    return  (
        <Grid container spacing={2} alignItems={"flex-start"}>
            <Grid item xs={12}>
                <Typography variant={"h2"}>{title}</Typography>
                <Typography variant={"subtitle1"}>{description}</Typography>
            </Grid>
            {pages.map((page)=>(
                 <Grid item key={page.props.title}>
                    <Card sx={{ maxWidth: 345, minHeight: 320 }}>
                        <CardHeader
                            avatar={<Avatar>
                                {page.props.title[0]}
                            </Avatar>}
                            action={
                                <Link href={page.endpoint}>
                                    <IconButton aria-label="settings">
                                        <ExitToAppIcon />
                                    </IconButton>
                                </Link>
                            }
                            title={page.props.title}
                        />
                        {page.props.icon &&
                                <div className="flex flex-row justify-center">
                                    <Image src={page.props.icon} alt={page.props.title} height={page.props.height || 100} width={page.props.width || 100}/>
                                </div>
                                // <div className="flex flex-row justify-center"
                                //     style={{
                                //     background: "linear-gradient(diagonal, #336699, #006666)",
                                //     overflow: "hidden",  
                                //     // height: "100%",
                                //     minHeight: 70,
                                //     position: "relative",
                                //     zIndex: 2
                                //     }}
                                // >
                                //     <Image src={page.props.icon} alt={page.props.title} fill={true} style={{objectFit: "contain"}}/>
                                //     {/* <Image src={e.image} alt={e.title} width={400} height={300}/> */}
                                // </div>
                            }
                        <CardContent>
                            
                            <Typography variant="body1">
                                {page.props.description}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    )
}