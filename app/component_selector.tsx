import TermAndGeneSearch from '@/components/TermAndGeneSearch'

export const Component = ({component, searchParams, props}: {component: string, searchParams: {[key:string]: any}, props: {[key:string]: any}}) => {
	if (component === "KnowledgeGraph") return <TermAndGeneSearch props={props} searchParams={searchParams}/>
	else return null
}