const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env'});

const crearToken = (usuario, secreta, expiresIn) => {
  const { id, email, nombre, apellido } = usuario;
  return jwt.sign({ id, email, nombre, apellido }, secreta, { expiresIn })
}

// Resolvers
const resolvers = {
  Query: {
    obtenerUsuario: async (_, {token}) => {
      const usuarioId = await jwt.verify(token, process.env.SECRETA);
      return usuarioId;
    }
  },
  Mutation: {
    nuevoUsuario: async (_, {input}) => {

      const { email, password } = input;
      // Revisar si el usuario ya esta registrado
      const existeUsuario = await Usuario.findOne({email});
      if(existeUsuario){
        throw new Error('El usuario ya esta registrado');
      }
      // Hashear su password
      const salt = bcrypt.genSaltSync(10);
      input.password = bcrypt.hashSync(password, salt);

      try {
        // Guardar en la base de datos
        const usuario = new Usuario(input);
        usuario.save();//guardarlo
        return usuario;
      } catch (error) {
        console.log(error)
      }
    },
    autenticarUsuario: async (_, {input}) => {
      const { email, password} = input;
      // Si el usuario existe
      const existeUsuario = await Usuario.findOne({email});
      if(!existeUsuario){
        throw new Error('El usuario no existe');
      }

      // Revisar si el password es correcto
      const passwordCorrecto = await bcrypt.compare(password, existeUsuario.password);
      if(!passwordCorrecto){
        throw new Error('El password es Incorrecto');
      }
      // Crear el token
      return {
        token: crearToken(existeUsuario, process.env.SECRETA, '24h')
      }
    }
  }
}

module.exports = resolvers;