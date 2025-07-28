import { getApiDocs } from '@/utils/swagger';
import ReactSwagger from './react-swagger';

export default async function APIDoc({title, spec}: {title?: string, spec?: string}) {
  let specs = {}
  if (spec) specs = await (await fetch(spec)).json()
  else specs = await getApiDocs(title);
  return (
    <section className="container">
      <ReactSwagger spec={specs} />
    </section>
  );
}