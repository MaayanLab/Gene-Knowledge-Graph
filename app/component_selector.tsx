import TermAndGeneSearch from '@/components/TermAndGeneSearch'
import DistilleryLanding from '@/components/Distillery'
import SanitizedHTML from '@/components/SanitizedHTML'
import Markdown from '@/components/MarkdownComponent'
import DistilleryUseCase from '@/components/Distillery/DistilleryUseCase'
import Enrichment from '@/components/Enrichment'
import Download from '@/components/Download'
import APIDoc from '@/components/APIDoc'
import WholeNetwork from '@/components/WholeNetwork'
import SimpleTermAndGeneSearch from '@/components/SimpleTermAndGeneSearch'
import Tutorial from '@/components/Tutorial.mdx'
import { Suspense } from 'react'
import { CircularProgress } from '@mui/material'
const AsyncComponent = async ({component, searchParams, props, endpoint,}: 
	{component: string, endpoint: string, searchParams: {[key:string]: any}, 
	props: {[key:string]: any}}) => {
	if (component === "KnowledgeGraph") return await TermAndGeneSearch({props, searchParams})
	else if (component === "SimpleKnowledgeGraph") return await SimpleTermAndGeneSearch({props, searchParams})
	else if (component === "DistilleryLanding") return await DistilleryLanding({...props})
	else if (component === "CardsLanding") return await DistilleryLanding({...props})
	else if (component === "SanitizedHTML") return await SanitizedHTML({...props})
	else if (component === "Markdown") return await Markdown({...props})
	else if (component === "UseCaseLanding") return await DistilleryLanding({...props})
	else if (component === "UseCase") return await DistilleryUseCase({...props, searchParams})
	else if (component === "Enrichment") return await Enrichment({endpoint, searchParams, ...props})
	else if (component === "Download") return await Download({...props})
	else if (component === "APIDoc") return await APIDoc({...props})
	else if (component === "Tutorial") return <Tutorial/>
	else if (component === "WholeNetwork") return await WholeNetwork({props})
	else return null
}

export const Component = (props: {component: string, endpoint: string, searchParams: {[key:string]: any}, props: {[key:string]: any}}) => {
	return <Suspense fallback={<CircularProgress/>}>
		{/* @ts-expect-error Server Component */}
		<AsyncComponent {...props}/>
	</Suspense>
}