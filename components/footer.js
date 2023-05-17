import dynamic from "next/dynamic";
import { useState } from "react";
import Image from 'next/image'
import { makeTemplate } from "../utils/helper";
import * as default_schema from '../public/schema.json'
import React from "react";
import { Typography } from "@mui/material";
import parse from 'html-react-parser';

import Icon from '@mdi/react';
import { mdiCookieOff, mdiCookie } from '@mdi/js';

const Grid = dynamic(() => import('@mui/material/Grid'));
const Paper = dynamic(() => import('@mui/material/Paper'));
const Button = dynamic(async () => (await import('@mui/material')).Button);
const Markdown = dynamic(() => import('./markdown'))


const GitHubIcon = dynamic(()=>import('@mui/icons-material/GitHub'));
const BugReportIcon = dynamic(()=>import('@mui/icons-material/BugReport'));

const FooterContents = ({footer, key, schema, consentCookie, setConsentCookie, resetCookie}) => {
    if (footer.type == "github") {
        return (
            <Grid item  key={key}>
                <Grid container direction="column">
					<Grid item>
						<Button 
							// variant="contained"
							startIcon={<GitHubIcon/>}
							href={footer.code}
							target="_blank" rel="noopener noreferrer"
							style={{textTransform: "none", color: (schema.ui || {}).footer_buttons === "light" ? "#000": "#FFF"}}
						>
							<Typography variant="subtitle2" color="#FFF">Github Repository</Typography>
						</Button>
					</Grid>
					<Grid item>
						<Button 
							// variant="contained"
							startIcon={<BugReportIcon/>}
							href={footer.issues}
							target="_blank" rel="noopener noreferrer"
							style={{textTransform: "none", color: (schema.ui || {}).footer_buttons === "light" ? "#000": "#FFF"}}
						>
							<Typography variant="subtitle2" color="#FFF">Report a Bug</Typography>
						</Button>
					</Grid>
					<Grid item>
						<Button 
							// variant="contained"
							startIcon={<Icon path={consentCookie==='allow' ? mdiCookieOff: mdiCookie} size={0.8} />}
							onClick={()=>{
								if (consentCookie==='allow'){
									setConsentCookie('deny')
								}
								else {
									setConsentCookie('allow')
								}
							}}
							style={{textTransform: "none", color: (schema.ui || {}).footer_buttons === "light" ? "#000": "#FFF"}}
						>
							<Typography variant="subtitle2" color="#FFF">{consentCookie === 'allow' ? 'Disable Google Analytics': 'Enable Google Analytics'}</Typography>
						</Button>
					</Grid>
					{/* <Grid item>
						<Button onClick={()=>resetCookie()}>
							Reset
						</Button>
							
					</Grid> */}
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

const Footer = ({schema, consentCookie, setConsentCookie, resetCookie}) => {
    if (!schema) schema = default_schema
	if (schema === undefined || schema.footer === undefined) return null

    return (
        <Paper square style={{boxShadow: "none",
			minHeight: 180,
			background: (schema.ui || {}).footer_background || "#000",
			flexShrink: 0,
			paddingTop: 30,
			paddingBottom: 30,
		}}>
            <Grid container justifyContent="space-around" alignItems={"center"}>
                {schema.footer.map((footer, i)=><React.Fragment  key={`footer-${i}`}><FooterContents footer={footer} schema={schema} consentCookie={consentCookie} setConsentCookie={setConsentCookie} resetCookie={resetCookie}/></React.Fragment>)}
				{schema.footer_text &&
					<Grid item xs={10} style={{marginTop: 30}}>
						<Typography variant="caption">{parse(schema.footer_text)}</Typography>
					</Grid>
				}
            </Grid>
        </Paper>
    )
}

export default Footer
