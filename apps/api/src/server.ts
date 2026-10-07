import Fastify from "fastify";
import cors from "@fastify/cors";
import { ingestRepository, detectLanguages, buildModuleGraph } from "@git-graph-agent/analysis-core";
import { toErrorResponse } from "./errorResponse.js";

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

app.get("/health", async () => ({ status: "ok" }));

app.post<{ Body: { repoUrl?: string } }>("/analyze", async (request, reply) => {
  const repoUrl = request.body?.repoUrl;
  if (!repoUrl) {
    return reply.code(400).send({ error: "repoUrl is required", code: "invalid_url" });
  }

  let ingested;
  try {
    ingested = await ingestRepository(repoUrl);
  } catch (err) {
    const { status, body } = toErrorResponse(err, app.log);
    return reply.code(status).send(body);
  }

  try {
    const [languages, graph] = await Promise.all([
      detectLanguages(ingested.localPath),
      buildModuleGraph(ingested.localPath),
    ]);
    return { repoUrl, commitSha: ingested.commitSha, languages, graph };
  } catch (err) {
    const { status, body } = toErrorResponse(err, app.log);
    return reply.code(status).send(body);
  } finally {
    await ingested.cleanup();
  }
});

const port = Number(process.env.PORT ?? 3001);
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
