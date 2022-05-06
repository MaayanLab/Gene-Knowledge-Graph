import dynamic from 'next/dynamic';
import prisma from '../lib/prisma'
import Image from 'next/image'

const Grid = dynamic(import('@mui/material/Grid'));
const Typography = dynamic(import('@mui/material/Typography'));
const Button = dynamic(async () => (await import('@mui/material')).Button);

export default function Home({nodes}) {
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
              const buttonType = "default"
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
										startIcon={<Image src={`${process.env.NEXT_PUBLIC_PREFIX}${b.icon}`} height={36} width={36}/>}
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
              const buttonType = "default"
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
										startIcon={<Image src={`${process.env.NEXT_PUBLIC_PREFIX}${b.icon}`} height={36} width={36}/>}
									>
										{b.name}
									</Button>
								</Grid>
							)
						})}
					</Grid>
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