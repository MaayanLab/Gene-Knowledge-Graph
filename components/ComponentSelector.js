import dynamic from 'next/dynamic';

const KnowledgeGraph = dynamic(() => import('./kg'));
const Enrichment = dynamic(()=>import("./Enrichment"));
const Markdown = dynamic(()=>import("./markdown"), {ssr: false});

export const components = {
  Enrichment: (props) => <Enrichment {...props}/>,
  KnowledgeGraph: (props) => <KnowledgeGraph {...props}/>,
  Markdown: (props) => <Markdown {...props} />
}