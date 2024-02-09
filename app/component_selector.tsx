import TermAndGeneSearch from '@/components/TermAndGeneSearch'
import DistilleryLanding from '@/components/Distillery'
import SanitizedHTML from '@/components/SanitizedHTML'
import Markdown from '@/components/Markdown'
import DistilleryUseCase from '@/components/Distillery/DistilleryUseCase'
export const Component = ({component, searchParams, props}: {component: string, searchParams: {[key:string]: any}, props: {[key:string]: any}}) => {
	if (component === "KnowledgeGraph") return <TermAndGeneSearch props={props} searchParams={searchParams}/>
	else if (component === "DistilleryLanding")return <DistilleryLanding {...props}/>
	else if (component === "SanitizedHTML")return <SanitizedHTML {...props}/>
	else if (component === "Markdown")return <Markdown {...props}/>
	else if (component === "DistilleryUseCase")return <DistilleryUseCase searchParams={searchParams} {...props}/>
	else return null
}