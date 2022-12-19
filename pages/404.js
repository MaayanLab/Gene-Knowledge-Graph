import dynamic from "next/dynamic";
import { fetch_kg_schema } from "../utils/initialize";
const Typography = dynamic(() => import('@mui/material/Typography'));
const Grid = dynamic(() => import('@mui/material/Grid'));


export default function Error() {
    return (
        <Grid container justifyContent={"center"} sx={{height: "100%"}}>
            <Grid item>
                <Typography variant="h5">Oops... we cannot find that page</Typography>
            </Grid>
        </Grid>
    )
}
export async function getStaticProps(ctx) {
    const schema = await fetch_kg_schema()
  
    return {
        props: {
            schema,
        }
      };
  }