import fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { Type } from '@sinclair/typebox';
import { faker } from '@faker-js/faker';

const server = fastify({
  logger: true,
});

await server.register(fastifyCors, {
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
});
await server.register(fastifyMultipart, {
  attachFieldsToBody: 'keyValues',
});
await server.register(fastifySwagger);
await server.register(fastifySwaggerUi);

const users = new Array(1000).fill(1).map(() => {
  return {
    id: crypto.randomUUID(),
    name: faker.person.firstName(),
    lastName: faker.person.lastName(),
    phoneNumber: faker.phone.number(),
  };
});

const PayloadSchema = Type.Object(
  {
    limit: Type.Optional(
      Type.Number({
        default: 20,
      }),
    ),
    offset: Type.Optional(
      Type.Number({
        default: 0,
      }),
    ),
  },
  {
    $id: 'Payload',
  },
);

const ResponseSchema = Type.Object(
  {
    items: Type.Array(
      Type.Object({
        id: Type.String(),
        name: Type.String(),
        lastName: Type.String(),
        phoneNumber: Type.String(),
      }),
    ),
    count: Type.Number(),
  },
  {
    $id: 'Response',
  },
);

await server.register(
  (instance, opts, done) => {
    instance.addSchema(PayloadSchema);
    instance.addSchema(ResponseSchema);
    instance.get(
      '/',
      {
        schema: {
          querystring: Type.Ref(PayloadSchema),
          response: {
            200: Type.Ref(ResponseSchema),
          },
        },
      },
      async (request) => {
        const { offset, limit } = request.query;
        console.log(request.query);

        return {
          items: users.slice(offset, offset + limit),
          count: users.length,
        };
      },
    );

    done();
  },
  {
    prefix: '/api/v1/users',
  },
);

await server.listen({
  port: 4322,
});
