import TermAndGeneSearch from '@/components/TermAndGeneSearch'
import DistilleryLanding from '@/components/Distillery'
import SanitizedHTML from '@/components/SanitizedHTML'
import Markdown from '@/components/MarkdownComponent'
import DistilleryUseCase from '@/components/Distillery/DistilleryUseCase'
import Enrichment from '@/components/Enrichment'
import Download from '@/components/Download'
import { Suspense } from 'react'
import { CircularProgress } from '@mui/material'
const AsyncComponent = async ({component, searchParams, props, endpoint,}: {component: string, endpoint: string, searchParams: {[key:string]: any}, props: {[key:string]: any}}) => {
	if (component === "KnowledgeGraph") return await TermAndGeneSearch({props, searchParams})
	else if (component === "DistilleryLanding") return await DistilleryLanding({...props})
	else if (component === "SanitizedHTML") return await SanitizedHTML({...props})
	else if (component === "Markdown") return await Markdown({...props})
	else if (component === "DistilleryUseCase") return await DistilleryUseCase({searchParams, ...props})
	else if (component === "Enrichment") return await Enrichment({endpoint, searchParams, ...props})
	else if (component === "Download") return await Download({...props})
	else return null
}

export const Component = (props: {component: string, endpoint: string, searchParams: {[key:string]: any}, props: {[key:string]: any}}) => {
	return <Suspense fallback={<CircularProgress/>}>
		{/* @ts-expect-error Server Component */}
		<AsyncComponent {...props}/>
	</Suspense>
}