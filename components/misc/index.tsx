import { Logo } from "./logo";
import Socials from "./social";
import Github from "./github";
import Link from "next/link";
import Image from "next/image";
import { Typography, 
    FormControl, 
    Select, 
    MenuItem, 
    Checkbox,
    Grid,
    Box,
    Avatar,
    Button
 } from "@mui/material"
import { NetworkSchema } from "@/app/api/knowledge_graph/route";
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  weight: ['400'],
  subsets: ['latin'],
  display: 'swap',
});


export const Selector = ({entries, 
    value, 
    onChange, 
    prefix, 
    sx={}, 
    multiple=false,
    ...props 
}: {
    entries: Array<string>,
    value: string | Array<string>, 
    onChange: Function, 
    prefix: string,
    sx?: {[key:string]: string|number},
    multiple?: boolean,
}) => {
    if (entries.length < 2) return null
    else return (
      <FormControl sx={{width: '100%'}}>
        <Select
          labelId={`${prefix}layouts-select`}
          id={`${prefix}-label`}
          value={value}
          onChange={(e,v)=>onChange(e.target.value)}
          variant="outlined"
          fullWidth={true}
          sx={{padding: 0, height: 45, ...sx}}
          {...props}
          >
          {entries.map(val=>(
            <MenuItem key={val} value={val}>{multiple && <Checkbox checked={value.indexOf(val)>-1}/>}{val.replace(/_/g," ")}</MenuItem>
          ))}
        </Select>
      </FormControl>
    )
  
}

export const Legend = ({
    elements={nodes:[], edges:[]}, 
    search=true, 
    legendSize=0
}: {
    elements: NetworkSchema,
    search?: boolean,
    legendSize: number
}) => {
    const colors = {  
    }
    const relation_colors = {  
    }
    const sizes = [15, 20, 30, 40, 50]
    const lineHeight = [2, 3, 4, 5, 6]
    const lineWidth = [20, 25, 30, 35, 40]
    const borders = [2, 2, 4, 6, 8]
    if (search) {
      colors["Search Term"] = <Grid item xs={12} key={"search"}>
      <Grid container alignItems={"center"} spacing={1} key="term">
        <Grid item><Avatar sx={{background: "#ff8a80", width: sizes[legendSize], height: sizes[legendSize]}}> </Avatar></Grid>
        <Grid item><Typography variant="subtitle1">Search Term</Typography></Grid>   
      </Grid></Grid>   
    }
    let not_significant = false
    const color_sum = {}
    const relations = []
    for (const i of [...elements.nodes, ...elements.edges]) {
      const {kind, color, borderColor, lineColor, relation, pval, ring_label}: {
        kind?:string,
        color?:string,
        borderColor?: string,
        lineColor?: string,
        relation?: string,
        pval?: number,
        ring_label?: string,
      } = i.data
      if (pval && pval > 0.05) not_significant = true
      if (kind === "Relation" && lineColor !== "#e0e0e0" && relation_colors[relation]===undefined) {
        relation_colors[relation] = <Grid item xs={12} key={kind}>
          <Grid container alignItems={"center"} spacing={1}>
            <Grid item><hr style={{color: lineColor, height: lineHeight[legendSize], backgroundColor: lineColor, width: lineWidth[legendSize], borderStyle: i.data.hidden ? 'dotted': 'solid'}}/></Grid>
            <Grid item><Typography variant="subtitle1">{relation}</Typography></Grid>   
          </Grid></Grid>
      }
      if (colors[kind]===undefined && color !== "#ff8a80" && kind !== "Relation") {
        color_sum[kind] = color
        colors[kind] = <Grid item xs={12} key={kind}>
          <Grid container alignItems={"center"} spacing={1}>
            <Grid item><Avatar sx={{background: color, width: sizes[legendSize], height: sizes[legendSize], borderColor, borderStyle: borderColor ? "solid": "none", borderWidth: borders[legendSize]}}> </Avatar></Grid>
            <Grid item><Typography variant="subtitle1">{kind}</Typography></Grid>   
          </Grid></Grid> 
      }
      if (colors[kind]!==undefined && color_sum[kind] === "#bdbdbd" && color !== "#ff8a80" && kind !== "Relation" ) {
        color_sum[kind] = color
        colors[kind] = <Grid item xs={12} key={kind}>
          <Grid container alignItems={"center"} spacing={1}>
            <Grid item><Avatar sx={{background: color, width: sizes[legendSize], height: sizes[legendSize], borderColor, borderWidth: borders[legendSize]}}> </Avatar></Grid>
            <Grid item><Typography variant="subtitle1">{kind}</Typography></Grid>   
          </Grid></Grid> 
      }
      if (ring_label && !colors[ring_label] && borderColor && !not_significant) {
        colors[ring_label] = <Grid item xs={12} key={ring_label}>
        <Grid container alignItems={"center"} spacing={1} key={ring_label}>
          <Grid item>
            <Avatar sx={{background: "#FFF", borderColor: borderColor, borderStyle: "solid", borderWidth: borders[legendSize], width: sizes[legendSize], height: sizes[legendSize]}}> </Avatar>
          </Grid>
          <Grid item><Typography variant="subtitle1">{ring_label}</Typography></Grid>   
        </Grid></Grid>   
      }
    }
    if (!search && not_significant) {
      colors["Not significant"] = <Grid item xs={12} key={"significant"}>
      <Grid container alignItems={"center"} spacing={1} key="significant">
        <Grid item>
          <Avatar sx={{background: "#FFF", borderColor: "#757575", borderStyle: "solid", borderWidth: borders[legendSize], width: sizes[legendSize], height: sizes[legendSize]}}> </Avatar>
        </Grid>
        <Grid item><Typography variant="subtitle1">{`Not significant (pval > 0.05)`}</Typography></Grid>   
      </Grid></Grid>   
    }
    return (
      <Box sx={{
        zIndex: 1,
        position: 'absolute',
        top: 25,
        left: 25,
        pointerEvents: "none"
      }}>
          <Grid container alignItems={"center"} spacing={legendSize > 1 ? 1: 0} sx={{maxHeight: 700, overflow: "hidden"}}>
            <Grid item xs={12}>
              <Typography variant="h6">
                <b>Legend</b>
              </Typography>
            </Grid>
            {Object.values(colors)}
            {Object.values(relation_colors)}
          </Grid>
      </Box>
    )
  }
  

export const Text = ({text}: {text:string}) => (
    <Typography variant="footer"><b>{text}</b></Typography>
)

export const TextLink = ({text, href}: {text:string, href: string}) => (
    <Link href={href}>
        <Typography variant="footer">{text}</Typography>
    </Link>
)

export const Icon = ({src, alt, href, height, width}: {src: string, alt: string, href?: string, height: number, width: number}) => {
  if (href === undefined) {
    return <Image src={src} alt={alt} height={height} width={width}/>
  } else {
    return <Link href={href} target="_blank" rel="noopener noreferrer">
      <Button>
        <Image src={src} alt={alt} height={height} width={width}/>
      </Button>
    </Link>
  }
}


const HarmonizomeFooter = () => {
  return (
    <Box className="footer container-full" sx={{ width: '100%', backgroundColor: '#eee', color: '#444', paddingTop: '0px !important', height: '150px', overflow: 'hidden', display: 'flex' }}>
      <Grid container className="container" sx={{ justifyContent: 'space-between', paddingLeft: '1%', marginTop: '0px'}}>
        <Grid item xs={12} md={10} className="pull-left" sx={{ maxWidth: '70%' }}>
          <ul id="contact" className="list-inline" style={{ listStyleType: 'none', padding: 0, display: 'flex', flexWrap: 'wrap', gap: '15px', fontFamily: roboto.style.fontFamily }}>
            <li>
              <Link href="http://icahn.mssm.edu/research/labs/maayan-laboratory" target="_blank" rel="noopener noreferrer" passHref>
                <Typography component="span" style={{ fontSize: '14px', textDecoration: 'none', color: 'inherit', fontFamily: roboto.style.fontFamily, fontWeight: '300' }}>
                  Ma'ayan Laboratory of Computational Systems Biology
                </Typography>
              </Link>
            </li>
            <li style={{ borderLeft: '1px solid #aaa', paddingLeft: '8px' }}>
              <Link href="/contact" passHref>
                <Typography component="span" style={{ fontSize: '14px', textDecoration: 'none', color: 'inherit', fontFamily: roboto.style.fontFamily }}>Contact Us</Typography>
              </Link>
            </li>
            <li style={{ borderLeft: '1px solid #aaa', paddingLeft: '8px' }}>
              <Link href="https://github.com/MaayanLab/harmonizome-issues/issues" target="_blank" rel="noopener noreferrer" passHref>
                <Typography component="span" style={{ fontSize: '14px', textDecoration: 'none', color: 'inherit', fontFamily: roboto.style.fontFamily }}>Submit an issue on GitHub</Typography>
              </Link>
            </li>
            <li style={{ borderLeft: '1px solid #aaa', paddingLeft: '8px' }}>
              <Link href="/terms" passHref>
                <Typography component="span" style={{ fontSize: '14px', textDecoration: 'none', color: 'inherit', fontFamily: roboto.style.fontFamily }}>Terms</Typography>
              </Link>
            </li>
          </ul>
          <Box id="citation" sx={{ marginTop: '5px' }}>
            <Typography variant="subtitle2" component="h6" sx={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px', fontFamily: roboto.style.fontFamily }}>
              Please acknowledge the Harmonizome in your publications by citing the following reference:
            </Typography>
            <Typography variant="body2" component="p" sx={{ fontSize: '14px', fontFamily: roboto.style.fontFamily, fontWeight: '300' }}>
              <Link href="http://database.oxfordjournals.org/content/2016/baw100.short" target="_blank" rel="noopener noreferrer" passHref>
                <span style={{ textDecoration: 'none', color: 'inherit', fontFamily: roboto.style.fontFamily }}>
                  Rouillard AD, Gundersen GW, Fernandez NF, Wang Z, Monteiro CD, McDermott MG, Ma'ayan A. 
                  <em>The harmonizome: a collection of processed datasets gathered to serve and mine knowledge 
                  about genes and proteins</em>. Database (Oxford). 2016 Jul 3;2016. pii: baw100.
                </span>
              </Link>
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={2} className="footer-right" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%' }}>
          <Box id="share" sx={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
            <Link href="https://twitter.com/intent/tweet?text=Harmonizome%203.0:%20Integrated%20Knowledge%20about%20Genes%20and%20Proteins%20from%20Diverse%20Multi-Omics%20Resources&url=https://maayanlab.cloud/Harmonizome" target="_blank" rel="noopener noreferrer" passHref>
              <span style={{ textDecoration: 'none' }}>
                <Image src="/image/share/twitter.png" alt="Twitter" width={25} height={25} />
              </span>
            </Link>
            <Link href="https://www.facebook.com/sharer/sharer.php?u=https://maayanlab.cloud/Harmonizome/" target="_blank" rel="noopener noreferrer" passHref>
              <span style={{ textDecoration: 'none' }}>
                <Image src="/image/share/facebook.png" alt="Facebook" width={25} height={25} />
              </span>
            </Link>
            <Link href="https://www.linkedin.com/shareArticle?url=https://maayanlab.cloud/Harmonizome" target="_blank" rel="noopener noreferrer" passHref>
              <span style={{ textDecoration: 'none' }}>
                <Image src="/image/share/linkedin.png" alt="LinkedIn" width={25} height={25} />
              </span>
            </Link>
          </Box>
          <Box id="license" sx={{ marginTop: 'auto', paddingBottom: '50px' }}>
            <Link href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer" passHref>
              <span style={{ textDecoration: 'none' }}>
                <Image src="/image/cc-by-nc-sa.png" alt="Creative Commons License" width={100} height={100} />
              </span>
            </Link>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

const MiscComponent = ({component, props}) => {
  if (component === 'logo') return <Logo {...props}/>
  else if (component === 'github') return <Github {...props}/>
  // else if (component === 'social') return <Socials {...props}/>
  else if (component === 'text') return <Text {...props}/>
  else if (component === 'link') return <TextLink {...props}/>
  else if (component === 'icon') return <Icon {...props}/>
  else if (component === 'harmonizome') return <HarmonizomeFooter/>
}

export default MiscComponent;