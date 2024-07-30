import { Container, Paper, Grid, Stack, Divider, Typography } from '@mui/material'
import parse from 'html-react-parser';
import MiscComponent from '../misc';


export default function Footer({style, layout, footer_text}: {
    style?: {
        [key: string]: string | number
    },
    layout: Array<Array<
        {
            component: string,
            props?: {
                [key:string]: string|number|boolean
            }
        }
    >>,
    footer_text?: string
}) {
    return (
        <Paper sx={{background: "#336699", color: "#FFF", padding: 1, paddingTop: 5, borderRadius: 0, ...style}}>
            <Container maxWidth="lg">
                <Grid container justifyContent={"space-around"} alignItems={"center"}>
                    {layout.map((part, index)=>{
                        const items = []
                        for (const ind in part ) {
                            const item = part[ind]
                            items.push(<div key={`${item.component}${ind}`}><MiscComponent component={item.component} props={item.props}/></div>)
                            if (["text", "link"].indexOf(item.component) === -1) {
                                if (parseInt(ind) !== part.length - 1) items.push(<Divider key={`div${ind}`} sx={{borderColor: "#FFF"}}/>)
                            }
                        }
                        return (
                            <Grid item key={index}>
                                <Stack direction={"column"} spacing={2}>
                                    {items}
                                </Stack>
                            </Grid>
                        )   
                    })}
                    <Grid item xs={12} sx={{marginTop: 5, marginRight: 5, marginLeft: 6}}>
                        <Stack spacing={2} direction={"row"} justifyContent="space-between">
                            {/* <div className='flex space-x-5'>
                                <Link href="/info/coming_soon"><Typography variant="caption">Terms of Service</Typography></Link>
                                <Link href="/info/coming_soon"><Typography variant="caption">Privacy Policy</Typography></Link>
                            </div> */}
                            {/* <Typography variant="caption">©CFDE Workbench {new Date().getFullYear()}</Typography> */}
                        </Stack>
                    </Grid>
                    {footer_text &&
                        <Grid item xs={10} style={{marginTop: 30}}>
                            <Typography variant="caption">{parse(footer_text)}</Typography>
                        </Grid>
                    }
                </Grid>
            </Container>
        </Paper>
    )
}
