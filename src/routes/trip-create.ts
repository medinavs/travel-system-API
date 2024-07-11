import { prisma } from '../lib/prisma'
import { z } from 'zod'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import type { FastifyInstance } from 'fastify'
import nodemailer from 'nodemailer'
import  localizedFormat  from 'dayjs/plugin/localizedFormat'
import { getMailClient } from '../lib/mail'


dayjs.locale('pt-br');
dayjs.extend(localizedFormat);

export const tripCreate = async (app: FastifyInstance) => {
    app.withTypeProvider<ZodTypeProvider>().put('/trip',{
        schema: {
            body: z.object ({ 
                destination: z.string().min(4),   
                starts_at:   z.coerce.date(),
                ends_at:    z.coerce.date(),
                owner_name: z.string().min(4),
                owner_email: z.string().email(),   
                emails_to_invite: z.array(z.string().email())
            })
        },
    }, async (request) => {
        
        const { destination, starts_at, ends_at, owner_name, owner_email, emails_to_invite } = request.body

        if(dayjs(starts_at).isBefore(new Date())){ 
            throw new Error('Tempo de viagem inválido')
        }

        if(dayjs(ends_at).isBefore(starts_at)){
            throw new Error('Tempo de viagem inválido')
        }


        const trip = await prisma.trip.create({ 
            data: {
                destination,
                starts_at,
                ends_at,
                participants: {
                    createMany: {
                        data: [
                            {
                                name: owner_name,
                                email: owner_email,
                                is_confirmed: true,
                                is_owner: true,
                            },
                            ...emails_to_invite.map(email =>{
                                return { email };
                            }),
                        ],
                    }
                }
            }
        })


        const formattedStartData = dayjs(starts_at).format('LL')
        const formattedEndData = dayjs(ends_at).format('LL')
        const mail = await getMailClient();
        const confirmationLink = `http://localhost:3333/trip/${trip.id}/confirm`


        const message = await mail.sendMail({ 
            from: { 
                name: 'Medina Trip',
                address: 'medinatrips@trip.com',
            }, 
            to: {
                name: owner_name,
                address: owner_email,
            },
            subject: 'Confirmação de viagem',
            html: `
            <div>
            <p>Olá, ${owner_name}! Sua viagem para ${destination} está quase lá!<p>
            <p>Confira os detalhes:</p>
            <p>Destino: ${destination}</p>
            <p>Data de início: ${formattedStartData}</p>
            <p>Data de término: ${formattedEndData}</p>
            <p></p>
            <p>Para confirmar a viagem, clique <a href="${confirmationLink}">aqui</a></p>
            </div>
            `
        })

        console.log(nodemailer.getTestMessageUrl(message));

        return { tripId: trip.id} 
    })
}
