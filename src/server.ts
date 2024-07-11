import fastify from 'fastify'
import { tripCreate } from './routes/trip-create';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { confirmTrip } from './routes/trip-get';
import cors  from '@fastify/cors' 


const app = fastify() 

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);


app.register(cors, {
    origin: '*',
});

app.register(tripCreate);
app.register(confirmTrip);


app.listen( {port:3333} ).then(() => {
    return console.log('server is running!!'); 
});