import dynamic from "next/dynamic";
import Link from "next/link";

const Grid = dynamic(() => import('@mui/material/Grid'));
const Typography = dynamic(() => import('@mui/material/Typography'));
const Card = dynamic(() => import('@mui/material/Card'));
const CardContent = dynamic(() => import('@mui/material/CardContent'));
const CardHeader = dynamic(() => import('@mui/material/CardHeader'));
const Avatar = dynamic(() => import('@mui/material/Avatar'));
const IconButton = dynamic(() => import('@mui/material/IconButton'));

const ExitToAppIcon = dynamic(() => import('@mui/icons-material/ExitToApp'));

export default function DistilleryLanding({
    title,
    description,
    pages
}) {
    return  (
        <Grid container spacing={2} alignItems={"center"}>
            <Grid item xs={12} sx={{textAlign: "center"}}>
                <Typography variant={"h5"}><b>{title}</b></Typography>
                <Typography>{description}</Typography>
            </Grid>
            {pages.map(page=>(
                 <Grid item>
                    <Card sx={{ maxWidth: 345, height: 300 }}>
                        <CardHeader
                            avatar={
                            <Avatar aria-label="recipe">
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