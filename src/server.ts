import fastify from 'fastify'
import cookie from '@fastify/cookie'
import { userRoutes } from './routes/user.routes'
import { mealsRoutes } from './routes/meals.routes'
import { env } from './env'

const app = fastify()

app.register(cookie)
app.register(userRoutes , {
  prefix: 'users',
})
app.register(mealsRoutes , {
  prefix: 'meals',
})

app
  .listen({
    port: env.PORT,
  })
  .then(() => {
    console.log('server running 😎 ')
  })
