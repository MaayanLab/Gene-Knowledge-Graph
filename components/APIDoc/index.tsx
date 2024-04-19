import { getApiDocs } from '@/utils/swagger';
import ReactSwagger from './react-swagger';

export default async function APIDoc() {
  const spec = await getApiDocs();
  return (
    <section className="container">
      <ReactSwagger spec={spec} />
    </section>
  );
}