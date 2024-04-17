"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/routes/meals.routes.ts
var meals_routes_exports = {};
__export(meals_routes_exports, {
  mealsRoutes: () => mealsRoutes
});
module.exports = __toCommonJS(meals_routes_exports);
var import_zod2 = require("zod");
var import_node_crypto = require("crypto");

// src/database.ts
var import_knex = require("knex");

// src/env.ts
var import_dotenv = require("dotenv");
var import_zod = require("zod");
if (process.env.NODE_ENV === "test") {
  (0, import_dotenv.config)({ path: ".env.test" });
} else {
  (0, import_dotenv.config)();
}
var envSchema = import_zod.z.object({
  NODE_ENV: import_zod.z.enum(["development", "test", "production"]).default("production"),
  DATABASE_CLIENT: import_zod.z.enum(["sqlite", "pg"]).default("sqlite"),
  DATABASE_URL: import_zod.z.string(),
  PORT: import_zod.z.coerce.number().default(3343)
});
var _env = envSchema.safeParse(process.env);
if (_env.success === false) {
  console.error("\u26A0\uFE0F Invalid environment variables", _env.error.format());
  throw new Error("Invalid environment variables.");
}
var env = _env.data;

// src/database.ts
var config2 = {
  client: "sqlite",
  connection: {
    filename: env.DATABASE_URL
  },
  useNullAsDefault: true,
  migrations: {
    extension: "ts",
    directory: "./db/migrations"
  }
};
var knex = (0, import_knex.knex)(config2);

// src/middlewares/check-session-exists.ts
async function checkSessionIdExists(request, reply) {
  const sessionId = request.cookies.sessionId;
  if (!sessionId) {
    return reply.status(401).send({ error: "unauthorized \u{1F914} " });
  }
  const user = await knex("users").where({ session_id: sessionId }).first();
  if (!user) {
    return reply.status(401).send({ error: "unauthorized \u{1F914} " });
  }
  request.user = user;
}

// src/routes/meals.routes.ts
async function mealsRoutes(app) {
  app.post("/", {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {
    const createMealBodySchema = import_zod2.z.object({
      name: import_zod2.z.string(),
      description: import_zod2.z.string(),
      isDiet: import_zod2.z.boolean(),
      date: import_zod2.z.coerce.date()
    });
    const { name, description, isDiet, date } = createMealBodySchema.parse(
      request.body
    );
    console.log(request.user);
    await knex("meals").insert({
      id: (0, import_node_crypto.randomUUID)(),
      name,
      description,
      is_on_diet: isDiet,
      date: date.getTime(),
      user_id: request.user?.id
    });
    return reply.status(201).send();
  });
  app.get("/", {
    preHandler: [checkSessionIdExists]
  }, async (request) => {
    const user = request.user;
    const meals = await knex("meals").select("*").where("user_id", user?.id).orderBy("date", "desc");
    if (meals.length === 0) {
      return {
        text: "User no have meals registered"
      };
    }
    return {
      meals
    };
  });
  app.get("/:id", {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {
    const paramsSchema = import_zod2.z.object({
      id: import_zod2.z.string().uuid()
    });
    const { id } = paramsSchema.parse(request.params);
    const meal = await knex("meals").where({
      id,
      user_id: request.user?.id
    }).first();
    if (!meal) {
      return reply.status(404).send({ error: " \u{1F622} Meal not found" });
    }
    return reply.send({ meal });
  });
  app.put("/:id", {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {
    const paramsSchema = import_zod2.z.object({
      id: import_zod2.z.string().uuid()
    });
    const { id } = paramsSchema.parse(request.params);
    const updateMealBodySchema = import_zod2.z.object({
      name: import_zod2.z.string(),
      description: import_zod2.z.string(),
      isDiet: import_zod2.z.boolean(),
      date: import_zod2.z.coerce.date()
    });
    const { name, description, isDiet, date } = updateMealBodySchema.parse(request.body);
    const meal = await knex("meals").where({
      id
    }).first();
    if (!meal) {
      reply.status(404).send({ error: "Meal not found \u{1F622}" });
    }
    console.log(request.user);
    const test = await knex("meals").where({
      id,
      user_id: request.user?.id
    }).update({
      name,
      description,
      is_on_diet: isDiet,
      date: date.getTime()
    });
    if (!test) {
      return reply.status(404).send({
        error: "meal not found \u{1F612}\u{1F612}"
      });
    }
    return reply.status(204).send();
  });
  app.delete("/:id", {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {
    const paramsSchemas = import_zod2.z.object({
      id: import_zod2.z.string().uuid()
    });
    const { id } = paramsSchemas.parse(request.params);
    const meal = await knex("meals").where({
      id,
      user_id: request.user?.id
    }).first();
    if (!meal) {
      return reply.status(404).send({ error: "Meal not found " });
    }
    await knex("meals").where({
      id,
      user_id: request.user?.id
    }).delete();
    return reply.status(204).send();
  });
  app.get("/metrics", {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {
    const totalMeals = await knex("meals").where({
      user_id: request.user?.id
    });
    const totalMealsOnDietValue = await knex("meals").where({
      user_id: request.user?.id,
      is_on_diet: true
    }).count("id", { as: "total" }).first();
    const totalMealsOffDietValue = await knex("meals").where({
      user_id: request.user?.id,
      is_on_diet: false
    }).count("id", { as: "total" }).first();
    let bestOnDietSequence = 0;
    let currentSequence = 0;
    for (const meal of totalMeals) {
      if (meal.is_on_diet) {
        currentSequence += 1;
      } else {
        currentSequence = 0;
      }
      if (currentSequence > bestOnDietSequence) {
        bestOnDietSequence = currentSequence;
      }
    }
    reply.send({
      totalMeals: totalMeals.length,
      totalMealsOnDiet: totalMealsOnDietValue,
      totalmealsOffDiet: totalMealsOffDietValue,
      bestSequence: bestOnDietSequence
    });
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  mealsRoutes
});
