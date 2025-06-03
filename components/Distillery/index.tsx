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
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <Typography variant={"h2"}>{title}</Typography>
                <Typography variant={"subtitle1"}>{description}</Typography>
            </Grid>
            {pages.map((page)=>(
                 <Grid item xs={6} md={4} key={page.props.title}>
                    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                        <CardHeader
                            avatar={<Avatar>
                                {page.props.title[0]}
                            </Avatar>}
                            action={
                                <Link href={page.endpoint + "?edge_labels=true"}>
                                    <IconButton aria-label="settings">
                                        <ExitToAppIcon />
                                    </IconButton>
                                </Link>
                            }
                            title={page.props.title}
                        />
                        {page.props.icon &&
                                <div className="flex flex-row justify-center"
                                    style={{
                                        overflow: "hidden",  
                                        minHeight: 100,
                                        position: "relative",
                                        zIndex: 2, 
                                        }}
                                >
                                    <Image src={page.props.icon} alt={page.props.title} height={page.props.height || 100} width={page.props.width || 100}/>
                                </div>
                            }
                        <CardContent  sx={{flexGrow: 2, height: "100%", justifyContent: "flex-end"}}>
                          
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