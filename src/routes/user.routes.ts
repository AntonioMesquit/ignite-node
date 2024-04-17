import {FastifyInstance} from 'fastify'
import { z } from 'zod'
import { randomUUID  } from 'node:crypto'
import { knex } from '../database'
export async function userRoutes(app: FastifyInstance){
  app.post('/' , async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string().email()
    })
    let sessionId = request.cookies.sessionId

    if(!sessionId){
      sessionId = randomUUID()
      reply.setCookie('sessionId' , sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7
      })
    }
    const {name, email} = createUserBodySchema.parse(request.body)


    const emailExistsInDataBase = await knex('users').where({email}).first()

    if(emailExistsInDataBase){
      return reply.status(400).send({message: '😰 email exists in data base'})
    }
    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      session_id: sessionId
    })
    return reply.status(201).send()
  })

}