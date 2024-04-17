import {FastifyReply, FastifyRequest} from 'fastify'
import { knex } from '../database'

export async function checkSessionIdExists(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const sessionId = request.cookies.sessionId

  if(!sessionId){
    return reply.status(401).send({error: 'unauthorized 🤔 '})
  }
  const user = await knex('users').where({session_id: sessionId}).first()

  if(!user){
    return reply.status(401).send({error: 'unauthorized 🤔 '})
  }
  
  request.user= user
}  