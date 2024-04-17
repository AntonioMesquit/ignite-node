import {FastifyInstance} from 'fastify'
import { z } from 'zod'
import { randomUUID  } from 'node:crypto'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-exists'
export async function mealsRoutes(app: FastifyInstance){
  app.post('/',{
    preHandler: [checkSessionIdExists]
  } , async (request, reply) => {
    const createMealBodySchema = z.object({
    name: z.string(),
    description: z.string(),
    isDiet: z.boolean(),
    date: z.coerce.date(),
    })

    const { name, description, isDiet, date } = createMealBodySchema.parse(
      request.body,
    )
    console.log(request.user)
    
    await knex('meals').insert({
      id: randomUUID(),
      name,
      description,
      is_on_diet: isDiet,
      date: knex.raw('?', [date]),
      user_id: request.user?.id,
    })
 return reply.status(201).send()
  })
  app.get('/',{
    preHandler: [checkSessionIdExists]
  } , async (request) => {
    const user = request.user
      const meals = await knex('meals').select('*').where('user_id', user?.id)
      .orderBy('date', 'desc')
      if(meals.length === 0){
        return {
          text: 'User no have meals registered'
        }
      }
      return {
        meals
      }
  })
  app.get('/:id' , {
    preHandler: [checkSessionIdExists]
  } , async (request, reply) => {
    const paramsSchema = z.object({
     id: z.string().uuid()
    })
    const  { id } = paramsSchema.parse(request.params)
    const meal = await knex('meals').where({
      id,
      user_id: request.user?.id

    }).first()

    if(!meal){
      return reply.status(404).send({ error: ' 😢 Meal not found' })
    }

    return reply.send({meal})
  })
  app.put('/:id' , {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid()
    })
    const {id} = paramsSchema.parse(request.params)

    const updateMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      isDiet: z.boolean(),
      date: z.coerce.date(),
      })
      const {name, description, isDiet, date} = updateMealBodySchema.parse(request.body)
      const meal = await knex('meals').where({
        id
      }).first()
      if(!meal){
        reply.status(404).send({error: 'Meal not found 😢'})
      }
      console.log(request.user)
      const test = await knex('meals').where({
        id,
        user_id: request.user?.id
      }).update({
        name,
        description,
        is_on_diet: isDiet,
        date: date.getTime()
      })
      if(!test){
        return reply.status(404).send({
          error: 'meal not found 😒😒'
        })
      }
      return reply.status(204).send()
  })
  app.delete('/:id' , {
    preHandler: [checkSessionIdExists] 
  }, async (request, reply) => {

    const paramsSchemas = z.object({
      id: z.string().uuid()
    })
    const {id} = paramsSchemas.parse(request.params)

    const meal = await knex('meals').where({
      id,
      user_id: request.user?.id 
    }).first()

    if (!meal) {
      return reply.status(404).send({ error: 'Meal not found ' })
    }
     await knex('meals').where({
      id,
      user_id: request.user?.id 
    }).delete()
    return reply.status(204).send()
  } )
  app.get('/metrics' , {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {

    const totalMeals = await knex('meals').where({
      user_id: request.user?.id
    })
    const totalMealsOnDietValue = await knex('meals')
    .where({
      user_id: request.user?.id,
      is_on_diet: true,
    }).count('id' , {as: 'total'}).first()

    const totalMealsOffDietValue = await knex('meals')
    .where({
      user_id: request.user?.id,
      is_on_diet: false,
    }).count('id' , {as: 'total'}).first()

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
    })
  })
  
 /* 
  - [x] Quantidade total de refeições registradas
  - [] Quantidade total de refeições dentro da dieta
  - [] Quantidade total de refeições fora da dieta
  - [] Melhor sequência de refeições dentro da dieta */
   

}