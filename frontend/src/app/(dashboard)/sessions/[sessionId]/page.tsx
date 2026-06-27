export default function SessionDetailPage({ params }: { params: { sessionId: string } }) {
  return (<div><h1>Session: {params.sessionId}</h1>{/* TODO: Phase 2 — Session results */}</div>);
}
