import dynamic from 'next/dynamic';

const KnowledgeGraph = dynamic(() => import('./TermAndGeneSearch'));
const Enrichment = dynamic(()=>import("./Enrichment"));
const Markdown = dynamic(()=>import("./markdown"), {ssr: false});
const DistilleryUseCase = dynamic(()=>import('./Distillery/DistilleryUseCase'));
export const components = {
  Enrichment: (props) => <Enrichment {...props}/>,
  KnowledgeGraph: (props) => <KnowledgeGraph {...props}/>,
  Markdown: (props) => <Markdown {...props} />,
  DistilleryUseCase: (props) => <DistilleryUseCase {...props}/>
}