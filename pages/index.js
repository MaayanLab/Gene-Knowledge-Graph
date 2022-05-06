import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import prisma from '../lib/prisma'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { fetch_workflow_of_node } from '../utils/search';
const Grid = dynamic(import('@mui/material/Grid'));
const Typography = dynamic(import('@mui/material/Typography'));
const Button = dynamic(async () => (await import('@mui/material')).Button);
const WorkFlowTable = dynamic(()=>import('../components/workflow_table'))

const buttonStyles = {
  disabled: {
    textTransform: "none",
		width: 160,
		height: 80,
		opacity: .4
	},
	enabled: {
    textTransform: "none",
		width: 160,
		height: 80,
		opacity: 1
	}
}

export default function Home({nodes, start, end, setStart, setEnd}) {
  const [colored, setColored] = useState(null)
  const [workflows, setWorkflows] = useState(null)
  const router = useRouter()
  useEffect(()=>{
		const resolve_workflow = async () => {
			const params = {}
			if (start) params.start = start
			if (end) params.end = end
			const {workflows, ...colored} = await fetch_workflow_of_node(params)
			setColored(colored)
			setWorkflows(workflows)
		} 
		if (start !== null || end!==null) {
			resolve_workflow()
		} else {
			setColored(null)
		}
		if (start === null && end === null) {
			setWorkflows(null)
		}
	}, [start, end])

  useEffect(()=> {
		setColored(null)
	},[router.pathname])

  return (
    <Grid container justifyContent="space-around" spacing={3}>
				<Grid item xs={6}>
					<Grid container justifyContent="space-around" spacing={1}>
						<Grid item xs={12}>
							<Typography variant={'h6'}>
								<b>Start with:</b>
							</Typography>
						</Grid>
						{nodes.map(b=>{
              let buttonType = "default"
              let buttonStyle = buttonStyles.enabled
							if (start === b.id) {
								buttonType = "primary"
							} else if (colored) {
								if ((colored || {}).start && colored.start.indexOf(b.id) > -1) {
									buttonType = "secondary"
								} else buttonStyle = buttonStyles.disabled 
							} 
							return (
								<Grid item xs={4} key={`start-${b.id}`}>
									<Button variant="contained"
										size="large"
										style={{
											textTransform: "none",
											width: 160,
											height: 80,
										}}
                    color={buttonType}
                    style={buttonStyle}
										startIcon={<Image src={`${process.env.NEXT_PUBLIC_PREFIX}${b.icon}`} height={36} width={36}/>}
                    onClick={()=>{
											if (start !== null && start === b.id) {
												setStart(null)
											} else {
												setStart(b.id)
											}
										}}
									>
										{b.name}
									</Button>
								</Grid>
							)
						})}
					</Grid>
				</Grid>
				<Grid item xs={6}>
					<Grid container justifyContent="space-around" spacing={1}>
						<Grid item xs={12}>
							<Typography variant={'h6'}>
								<b>End with:</b>
							</Typography>
						</Grid>
						{nodes.map(b=>{
              let buttonType = "default"
              let buttonStyle = buttonStyles.enabled 
							if (end === b.id) {
								buttonType = "primary"
							}else if (colored) {
								if ((colored || {}).end && colored.end.indexOf(b.id) > -1) {
									buttonType = "secondary"
								} else buttonStyle = buttonStyles.disabled 
							}
							return(
								<Grid item xs={4} key={`end-${b.id}`}>
									<Button variant="contained"
										size="large"
										style={{
											textTransform: "none",
											width: 160,
											height: 80,
										}} 
                    color={buttonType}
                    style={buttonStyle}
                    onClick={()=>{
											if (end !== null && end === b.id) {
												setEnd(null)
											} else {
												setEnd(b.id)
											}
										}}
										startIcon={<Image src={`${process.env.NEXT_PUBLIC_PREFIX}${b.icon}`} height={36} width={36}/>}
									>
										{b.name}
									</Button>
								</Grid>
							)
						})}
					</Grid>
				</Grid>
				<Grid item xs={12}>
					{(workflows && workflows.length > 0) && <WorkFlowTable workflows={workflows}/>}
				</Grid>
      </Grid>
  )
}

export async function getStaticProps(ctx) {
	const resources = await prisma.resource.findMany({
		orderBy: [
			{
			  priority: 'asc',
			}
		]
	})
	const nodes = await prisma.node.findMany({
		orderBy: [
			{
			  priority: 'asc',
			}
		]
	})
	return {
	  props: {
      resources,
      nodes
    }
	};
  }