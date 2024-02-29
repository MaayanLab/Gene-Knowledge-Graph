import Link from "next/link";
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
		endpoint,
		label,
		props: {
			[key: string]: any
		}
	}>
}) {
    return  (
        <Grid container spacing={2} alignItems={"center"}>
            <Grid item xs={12}>
                <Typography variant={"h2"}>{title}</Typography>
                <Typography variant={"subtitle1"}>{description}</Typography>
            </Grid>
            {pages.map((page)=>(
                 <Grid item key={page.props.title}>
                    <Card sx={{ maxWidth: 345, height: 300 }}>
                        <CardHeader
                            avatar={
                            page.props.icon ?
                            <Avatar src={page.props.icon} alt={page.props.title}/>:
                            <Avatar>
                                {page.props.title[0]}
                            </Avatar>
                            }
                            action={
                                <Link href={page.endpoint}>
                                    <IconButton aria-label="settings">
                                        <ExitToAppIcon />
                                    </IconButton>
                                </Link>
                            }
                            title={page.props.title}
                        />
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