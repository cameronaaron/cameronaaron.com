import { buildStructuredDataGraph } from './structured-data/builders';

export default function StructuredData() {
  const schemaGraph = buildStructuredDataGraph();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
      />
    </>
  );
}
