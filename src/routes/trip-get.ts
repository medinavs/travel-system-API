import { z } from 'zod'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import type { FastifyInstance } from 'fastify'


export const confirmTrip = async (app: FastifyInstance) => {
    app.withTypeProvider<ZodTypeProvider>().get('/trip:tripId/confirm',{
        schema: {
            params: z.object ({ 
                tripId:    z.string().uuid()   
            })
        },
    }, async (request) => {

        return { request: request.params.tripId } 
    })
}
