import fastify from 'fastify'
import cookie from '@fastify/cookie'
import { userRoutes } from './routes/user.routes'
import { mealsRoutes } from './routes/meals.routes'

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
    port: 3343,
  })
  .then(() => {
    console.log('server running 😎 ')
  })
