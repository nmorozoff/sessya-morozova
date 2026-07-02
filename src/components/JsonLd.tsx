type JsonLdProps = {
  id: string;
  data: Record<string, unknown> | Record<string, unknown>[];
};

const JsonLd = ({ id, data }: JsonLdProps) => (
  <script
    id={`jsonld-${id}`}
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
);

export default JsonLd;
