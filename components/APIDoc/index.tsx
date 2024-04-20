import { getApiDocs } from '@/utils/swagger';
import ReactSwagger from './react-swagger';

export default async function APIDoc({spec}: {spec?: string}) {
  let specs = {}
  if (spec) specs = await (await fetch(spec)).json()
  else specs = await getApiDocs();
  
  return (
    <section className="container">
      <ReactSwagger spec={specs} />
    </section>
  );
}